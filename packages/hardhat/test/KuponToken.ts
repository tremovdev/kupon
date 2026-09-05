import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const RESIDENCY_ID = ethers.id("RESIDENCY_ID");
const ACCREDITED = ethers.id("ACCREDITED");
const ISSUER_ROLE = ethers.id("ISSUER_ROLE");
const R1_RESIDENCY = ethers.id("R1-RESIDENCY");
const R2_CAP = ethers.id("R2-CAP");
const R3_FROZEN = ethers.id("R3-FROZEN");

const SERIES_CAP = 100_000n * 10n ** 18n; // 100,000 KPON total issuance
const ONE = 10n ** 18n; // 1 KPON
const CAP = 5_000n * 10n ** 18n; // default retail cap
// The fixture issues this to `sender` before every test runs.
const FIXTURE_SUPPLY = 1_000n * 10n ** 18n;

async function deployKuponFixture() {
  const [admin, sender, recipient, stranger, accredited] = await ethers.getSigners();
  const registry = await (await ethers.getContractFactory("KuponClaimRegistry", admin)).deploy(admin.address);
  const compliance = await (
    await ethers.getContractFactory("KuponComplianceModule", admin)
  ).deploy(await registry.getAddress(), admin.address);
  const token = await (
    await ethers.getContractFactory("KuponToken", admin)
  ).deploy(await compliance.getAddress(), admin.address);
  // Demo setup: sender is a retail (residency-only) wallet already funded by the issuer.
  await registry.grantClaim(sender.address, RESIDENCY_ID);
  await registry.grantClaim(accredited.address, ACCREDITED);
  await token.issue(sender.address, 1_000n * ONE);
  return { registry, compliance, token, admin, sender, recipient, stranger, accredited };
}

describe("KuponToken", function () {
  describe("Deployment", function () {
    it("deploys as the Kupon SBN Ritel 2027 series with KPON symbol", async function () {
      const { token } = await networkHelpers.loadFixture(deployKuponFixture);
      expect(await token.name()).to.equal("Kupon SBN Ritel 2027");
      expect(await token.symbol()).to.equal("KPON");
    });

    it("grants ISSUER_ROLE to the deployer and exposes the 100k series cap", async function () {
      const { token, admin } = await networkHelpers.loadFixture(deployKuponFixture);
      expect(await token.hasRole(ISSUER_ROLE, admin.address)).to.equal(true);
      expect(await token.SERIES_CAP()).to.equal(SERIES_CAP);
      // Fixture funds `sender` with 1,000 KPON.
      expect(await token.totalSupply()).to.equal(FIXTURE_SUPPLY);
    });
  });

  describe("issue (gated mint)", function () {
    it("issuer mints to a compliant wallet", async function () {
      const { token, registry, admin, recipient } = await networkHelpers.loadFixture(deployKuponFixture);
      await registry.grantClaim(recipient.address, RESIDENCY_ID);
      await expect(token.connect(admin).issue(recipient.address, 10n * ONE))
        .to.emit(token, "Transfer")
        .withArgs(ZERO_ADDRESS, recipient.address, 10n * ONE);
      expect(await token.balanceOf(recipient.address)).to.equal(10n * ONE);
      expect(await token.totalSupply()).to.equal(FIXTURE_SUPPLY + 10n * ONE);
    });

    it("reverts issuing to a wallet without any claim (same gate as transfers)", async function () {
      const { token, compliance, admin, stranger } = await networkHelpers.loadFixture(deployKuponFixture);
      await expect(token.connect(admin).issue(stranger.address, ONE))
        .to.be.revertedWithCustomError(compliance, "Kupon__RuleViolated")
        .withArgs(R1_RESIDENCY);
    });

    it("reverts issuing past the retail cap to a residency-only wallet", async function () {
      const { token, compliance, registry, admin, recipient } = await networkHelpers.loadFixture(deployKuponFixture);
      await registry.grantClaim(recipient.address, RESIDENCY_ID);
      await expect(token.connect(admin).issue(recipient.address, CAP + ONE))
        .to.be.revertedWithCustomError(compliance, "Kupon__RuleViolated")
        .withArgs(R2_CAP);
    });

    it("reverts when a non-issuer issues", async function () {
      const { token, registry, recipient } = await networkHelpers.loadFixture(deployKuponFixture);
      await registry.grantClaim(recipient.address, RESIDENCY_ID);
      await expect(token.connect(recipient).issue(recipient.address, ONE))
        .to.be.revertedWithCustomError(token, "AccessControlUnauthorizedAccount")
        .withArgs(recipient.address, ISSUER_ROLE);
    });

    it("enforces the 100k series cap (exact pass, +1 revert)", async function () {
      const { token, admin, accredited } = await networkHelpers.loadFixture(deployKuponFixture);
      // Accredited = cap-exempt, so only the series cap can fire. Fill up to exactly 100k.
      await token.connect(admin).issue(accredited.address, SERIES_CAP - FIXTURE_SUPPLY);
      expect(await token.totalSupply()).to.equal(SERIES_CAP);
      await expect(token.connect(admin).issue(accredited.address, 1n))
        .to.be.revertedWithCustomError(token, "Kupon__SeriesCapExceeded")
        .withArgs(SERIES_CAP, 1n);
    });
  });

  describe("transfers (compliance hook)", function () {
    it("compliant wallet transfers to a compliant wallet", async function () {
      const { token, registry, sender, recipient } = await networkHelpers.loadFixture(deployKuponFixture);
      await registry.grantClaim(recipient.address, RESIDENCY_ID);
      await expect(token.connect(sender).transfer(recipient.address, 10n * ONE))
        .to.emit(token, "Transfer")
        .withArgs(sender.address, recipient.address, 10n * ONE);
      expect(await token.balanceOf(sender.address)).to.equal(990n * ONE);
      expect(await token.balanceOf(recipient.address)).to.equal(10n * ONE);
    });

    it("reverts transferring to a wallet without any claim, naming R1-RESIDENCY", async function () {
      const { token, compliance, sender, stranger } = await networkHelpers.loadFixture(deployKuponFixture);
      await expect(token.connect(sender).transfer(stranger.address, ONE))
        .to.be.revertedWithCustomError(compliance, "Kupon__RuleViolated")
        .withArgs(R1_RESIDENCY);
    });

    it("reverts transfers from a frozen (revoked) wallet, naming R3-FROZEN", async function () {
      const { token, compliance, registry, sender, recipient } = await networkHelpers.loadFixture(deployKuponFixture);
      await registry.grantClaim(recipient.address, RESIDENCY_ID);
      await registry.revokeClaim(sender.address, RESIDENCY_ID);
      await expect(token.connect(sender).transfer(recipient.address, ONE))
        .to.be.revertedWithCustomError(compliance, "Kupon__RuleViolated")
        .withArgs(R3_FROZEN);
    });

    it("enforces the retail cap through transfers (exact pass, +1 revert)", async function () {
      const { token, compliance, registry, admin, sender, recipient } =
        await networkHelpers.loadFixture(deployKuponFixture);
      await registry.grantClaim(recipient.address, RESIDENCY_ID);
      await token.connect(admin).issue(recipient.address, CAP - 10n * ONE); // 4,990 KPON
      // Landing exactly on 5,000 passes...
      await token.connect(sender).transfer(recipient.address, 10n * ONE);
      expect(await token.balanceOf(recipient.address)).to.equal(CAP);
      // ...one more KPON reverts with R2-CAP.
      await expect(token.connect(sender).transfer(recipient.address, ONE))
        .to.be.revertedWithCustomError(compliance, "Kupon__RuleViolated")
        .withArgs(R2_CAP);
    });
  });

  describe("approve/transferFrom (no bypass)", function () {
    it("transferFrom obeys the identical rules", async function () {
      const { token, compliance, registry, sender, recipient, stranger } =
        await networkHelpers.loadFixture(deployKuponFixture);
      await token.connect(sender).approve(stranger.address, 2n * ONE);
      // Compliant path passes.
      await registry.grantClaim(recipient.address, RESIDENCY_ID);
      await token.connect(stranger).transferFrom(sender.address, recipient.address, ONE);
      expect(await token.balanceOf(recipient.address)).to.equal(ONE);
      // Non-compliant recipient is blocked by the same R1 rule.
      await expect(token.connect(stranger).transferFrom(sender.address, stranger.address, ONE))
        .to.be.revertedWithCustomError(compliance, "Kupon__RuleViolated")
        .withArgs(R1_RESIDENCY);
    });
  });
});
