import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const RESIDENCY_ID = ethers.id("RESIDENCY_ID");
const ACCREDITED = ethers.id("ACCREDITED");
const COMPLIANCE_ADMIN_ROLE = ethers.id("COMPLIANCE_ADMIN_ROLE");
const R1_RESIDENCY = ethers.id("R1-RESIDENCY");
const R2_CAP = ethers.id("R2-CAP");
const R3_FROZEN = ethers.id("R3-FROZEN");

const CAP = 5_000n * 10n ** 18n; // default cap: 5,000 KPON (decimals 18)
const ONE = 10n ** 18n; // 1 KPON

async function deployComplianceFixture() {
  const [admin, sender, recipient, stranger] = await ethers.getSigners();
  const registry = await (await ethers.getContractFactory("KuponClaimRegistry", admin)).deploy(admin.address);
  const compliance = await (
    await ethers.getContractFactory("KuponComplianceModule", admin)
  ).deploy(await registry.getAddress(), admin.address);
  // Sender starts compliant so recipient-side rules can be exercised in isolation.
  await registry.grantClaim(sender.address, RESIDENCY_ID);
  return { registry, compliance, admin, sender, recipient, stranger };
}

describe("KuponComplianceModule", function () {
  describe("Configuration", function () {
    it("starts with the 5,000 KPON default cap and admin role on the deployer", async function () {
      const { compliance, admin } = await networkHelpers.loadFixture(deployComplianceFixture);
      expect(await compliance.cap()).to.equal(CAP);
      expect(await compliance.hasRole(COMPLIANCE_ADMIN_ROLE, admin.address)).to.equal(true);
    });

    it("admin can update the cap and CapChanged is emitted", async function () {
      const { compliance, admin } = await networkHelpers.loadFixture(deployComplianceFixture);
      const newCap = 1_000n * 10n ** 18n;
      await expect(compliance.connect(admin).setCap(newCap)).to.emit(compliance, "CapChanged").withArgs(CAP, newCap);
      expect(await compliance.cap()).to.equal(newCap);
    });

    it("reverts when a non-admin updates the cap", async function () {
      const { compliance, stranger } = await networkHelpers.loadFixture(deployComplianceFixture);
      await expect(compliance.connect(stranger).setCap(1n))
        .to.be.revertedWithCustomError(compliance, "AccessControlUnauthorizedAccount")
        .withArgs(stranger.address, COMPLIANCE_ADMIN_ROLE);
    });
  });

  describe("R1-RESIDENCY (entry claim)", function () {
    it("blocks transfers to a wallet without any claim", async function () {
      const { compliance, sender, recipient } = await networkHelpers.loadFixture(deployComplianceFixture);
      await expect(compliance.enforceTransfer(sender.address, recipient.address, ONE, 0n))
        .to.be.revertedWithCustomError(compliance, "Kupon__RuleViolated")
        .withArgs(R1_RESIDENCY);
    });

    it("allows transfers to a RESIDENCY_ID holder", async function () {
      const { compliance, registry, sender, recipient } = await networkHelpers.loadFixture(deployComplianceFixture);
      await registry.grantClaim(recipient.address, RESIDENCY_ID);
      await expect(compliance.enforceTransfer(sender.address, recipient.address, ONE, 0n)).to.not.be.revert(ethers);
    });

    it("allows transfers to an ACCREDITED holder", async function () {
      const { compliance, registry, sender, recipient } = await networkHelpers.loadFixture(deployComplianceFixture);
      await registry.grantClaim(recipient.address, ACCREDITED);
      await expect(compliance.enforceTransfer(sender.address, recipient.address, ONE, 0n)).to.not.be.revert(ethers);
    });

    it("blocks mints (from = zero address) to a wallet without any claim", async function () {
      const { compliance, recipient } = await networkHelpers.loadFixture(deployComplianceFixture);
      await expect(compliance.enforceTransfer(ZERO_ADDRESS, recipient.address, ONE, 0n))
        .to.be.revertedWithCustomError(compliance, "Kupon__RuleViolated")
        .withArgs(R1_RESIDENCY);
    });
  });

  describe("R3-FROZEN (revoked wallet)", function () {
    it("blocks transfers from a wallet holding no claim", async function () {
      const { compliance, registry, recipient, stranger } = await networkHelpers.loadFixture(deployComplianceFixture);
      // Recipient is compliant so only the sender-side freeze can fire; stranger holds no claim.
      await registry.grantClaim(recipient.address, RESIDENCY_ID);
      await expect(compliance.enforceTransfer(stranger.address, recipient.address, ONE, 0n))
        .to.be.revertedWithCustomError(compliance, "Kupon__RuleViolated")
        .withArgs(R3_FROZEN);
    });

    it("allows transfers from a claimed wallet to a claimed wallet", async function () {
      const { compliance, registry, sender, recipient } = await networkHelpers.loadFixture(deployComplianceFixture);
      await registry.grantClaim(recipient.address, RESIDENCY_ID);
      await expect(compliance.enforceTransfer(sender.address, recipient.address, ONE, 0n)).to.not.be.revert(ethers);
    });

    it("re-granting a claim instantly unfreezes the wallet", async function () {
      const { compliance, registry, sender, recipient } = await networkHelpers.loadFixture(deployComplianceFixture);
      await registry.grantClaim(sender.address, RESIDENCY_ID);
      await registry.grantClaim(recipient.address, RESIDENCY_ID);
      // Revoked = holds nothing = frozen again.
      await registry.revokeClaim(sender.address, RESIDENCY_ID);
      await expect(compliance.enforceTransfer(sender.address, recipient.address, ONE, 0n))
        .to.be.revertedWithCustomError(compliance, "Kupon__RuleViolated")
        .withArgs(R3_FROZEN);
      // Re-grant = instantly unfrozen, no cached flag.
      await registry.grantClaim(sender.address, RESIDENCY_ID);
      await expect(compliance.enforceTransfer(sender.address, recipient.address, ONE, 0n)).to.not.be.revert(ethers);
    });
  });

  describe("R2-CAP (retail holding cap)", function () {
    it("allows a retail wallet to land exactly on the cap", async function () {
      const { compliance, registry, sender, recipient } = await networkHelpers.loadFixture(deployComplianceFixture);
      await registry.grantClaim(recipient.address, RESIDENCY_ID);
      // balanceAfter = toBalance + value == cap exactly
      await expect(compliance.enforceTransfer(sender.address, recipient.address, ONE, CAP - ONE)).to.not.be.revert(
        ethers,
      );
    });

    it("blocks a retail transfer that would exceed the cap by 1", async function () {
      const { compliance, registry, sender, recipient } = await networkHelpers.loadFixture(deployComplianceFixture);
      await registry.grantClaim(recipient.address, RESIDENCY_ID);
      await expect(compliance.enforceTransfer(sender.address, recipient.address, ONE, CAP))
        .to.be.revertedWithCustomError(compliance, "Kupon__RuleViolated")
        .withArgs(R2_CAP);
    });

    it("does not apply the cap to ACCREDITED wallets", async function () {
      const { compliance, registry, sender, recipient } = await networkHelpers.loadFixture(deployComplianceFixture);
      await registry.grantClaim(recipient.address, ACCREDITED);
      await expect(compliance.enforceTransfer(sender.address, recipient.address, CAP, CAP * 10n)).to.not.be.revert(
        ethers,
      );
    });

    it("applies the updated cap immediately (live configuration)", async function () {
      const { compliance, registry, admin, sender, recipient } =
        await networkHelpers.loadFixture(deployComplianceFixture);
      await registry.grantClaim(recipient.address, RESIDENCY_ID);
      // Passes under the default cap...
      await expect(compliance.enforceTransfer(sender.address, recipient.address, ONE, CAP - ONE)).to.not.be.revert(
        ethers,
      );
      // ...and reverts once the admin lowers the cap.
      await compliance.connect(admin).setCap(ONE);
      await expect(compliance.enforceTransfer(sender.address, recipient.address, ONE, CAP - ONE))
        .to.be.revertedWithCustomError(compliance, "Kupon__RuleViolated")
        .withArgs(R2_CAP);
    });
  });
});
