import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.create();

describe("KuponClaimRegistry", function () {
  const RESIDENCY_ID = ethers.id("RESIDENCY_ID");
  const ACCREDITED = ethers.id("ACCREDITED");
  const REGISTRAR_ROLE = ethers.id("REGISTRAR_ROLE");

  async function deployRegistryFixture() {
    const [registrar, investor, stranger] = await ethers.getSigners();
    const registry = await (await ethers.getContractFactory("KuponClaimRegistry", registrar)).deploy(registrar.address);
    return { registry, registrar, investor, stranger };
  }

  describe("Deployment", function () {
    it("grants the deployer the REGISTRAR_ROLE", async function () {
      const { registry, registrar } = await networkHelpers.loadFixture(deployRegistryFixture);
      expect(await registry.hasRole(REGISTRAR_ROLE, registrar.address)).to.equal(true);
    });

    it("starts every wallet with no claims", async function () {
      const { registry, investor } = await networkHelpers.loadFixture(deployRegistryFixture);
      expect(await registry.hasClaim(investor.address, RESIDENCY_ID)).to.equal(false);
      expect(await registry.hasClaim(investor.address, ACCREDITED)).to.equal(false);
    });
  });

  describe("grantClaim", function () {
    it("registrar grants RESIDENCY_ID and emits ClaimGranted", async function () {
      const { registry, registrar, investor } = await networkHelpers.loadFixture(deployRegistryFixture);
      await expect(registry.connect(registrar).grantClaim(investor.address, RESIDENCY_ID))
        .to.emit(registry, "ClaimGranted")
        .withArgs(investor.address, RESIDENCY_ID);
      expect(await registry.hasClaim(investor.address, RESIDENCY_ID)).to.equal(true);
    });

    it("tracks ACCREDITED independently of RESIDENCY_ID", async function () {
      const { registry, registrar, investor } = await networkHelpers.loadFixture(deployRegistryFixture);
      await expect(registry.connect(registrar).grantClaim(investor.address, ACCREDITED))
        .to.emit(registry, "ClaimGranted")
        .withArgs(investor.address, ACCREDITED);
      expect(await registry.hasClaim(investor.address, ACCREDITED)).to.equal(true);
      expect(await registry.hasClaim(investor.address, RESIDENCY_ID)).to.equal(false);
    });

    it("reverts when a non-registrar grants a claim", async function () {
      const { registry, stranger, investor } = await networkHelpers.loadFixture(deployRegistryFixture);
      await expect(registry.connect(stranger).grantClaim(investor.address, RESIDENCY_ID))
        .to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount")
        .withArgs(stranger.address, REGISTRAR_ROLE);
    });

    it("reverts on a claim type outside the known set", async function () {
      const { registry, registrar, investor } = await networkHelpers.loadFixture(deployRegistryFixture);
      const unknownClaim = ethers.id("UNKNOWN_CLAIM");
      await expect(registry.connect(registrar).grantClaim(investor.address, unknownClaim))
        .to.be.revertedWithCustomError(registry, "Kupon__InvalidClaim")
        .withArgs(unknownClaim);
    });
  });

  describe("idempotence and revocation", function () {
    it("granting the same claim twice is a no-op with no second event", async function () {
      const { registry, registrar, investor } = await networkHelpers.loadFixture(deployRegistryFixture);
      await registry.connect(registrar).grantClaim(investor.address, RESIDENCY_ID);
      await expect(registry.connect(registrar).grantClaim(investor.address, RESIDENCY_ID)).to.not.emit(
        registry,
        "ClaimGranted",
      );
      expect(await registry.hasClaim(investor.address, RESIDENCY_ID)).to.equal(true);
    });

    it("registrar revokes a held claim and emits ClaimRevoked", async function () {
      const { registry, registrar, investor } = await networkHelpers.loadFixture(deployRegistryFixture);
      await registry.connect(registrar).grantClaim(investor.address, RESIDENCY_ID);
      await expect(registry.connect(registrar).revokeClaim(investor.address, RESIDENCY_ID))
        .to.emit(registry, "ClaimRevoked")
        .withArgs(investor.address, RESIDENCY_ID);
      expect(await registry.hasClaim(investor.address, RESIDENCY_ID)).to.equal(false);
    });

    it("revoking a claim the wallet does not hold is a no-op", async function () {
      const { registry, registrar, investor } = await networkHelpers.loadFixture(deployRegistryFixture);
      await expect(registry.connect(registrar).revokeClaim(investor.address, RESIDENCY_ID)).to.not.emit(
        registry,
        "ClaimRevoked",
      );
      expect(await registry.hasClaim(investor.address, RESIDENCY_ID)).to.equal(false);
    });

    it("reverts when a non-registrar revokes a claim", async function () {
      const { registry, stranger, investor } = await networkHelpers.loadFixture(deployRegistryFixture);
      await expect(registry.connect(stranger).revokeClaim(investor.address, RESIDENCY_ID))
        .to.be.revertedWithCustomError(registry, "AccessControlUnauthorizedAccount")
        .withArgs(stranger.address, REGISTRAR_ROLE);
    });
  });
});
