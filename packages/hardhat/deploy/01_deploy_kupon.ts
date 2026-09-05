import { deployScript, artifacts } from "../rocketh/deploy.js";

/**
 * Deploys the Kupon compliance stack in dependency order:
 *   KuponClaimRegistry → KuponComplianceModule → KuponToken
 *
 * All demo roles (registrar, compliance admin, issuer) go to the deployer EOA —
 * deliberate demo centralization recorded as a threat-model limitation in the SPEC.
 *
 * @param env Rocketh environment object.
 */
export default deployScript(
  async env => {
    const { deployer } = env.namedAccounts;

    const registry = await env.deploy("KuponClaimRegistry", {
      account: deployer,
      artifact: artifacts.KuponClaimRegistry,
      // Constructor: registrar = deployer
      args: [deployer],
    });

    const compliance = await env.deploy("KuponComplianceModule", {
      account: deployer,
      artifact: artifacts.KuponComplianceModule,
      // Constructor: registry + compliance admin = deployer
      args: [registry.address, deployer],
    });

    const token = await env.deploy("KuponToken", {
      account: deployer,
      artifact: artifacts.KuponToken,
      // Constructor: compliance module + admin/issuer = deployer
      args: [compliance.address, deployer],
    });

    console.log("🏛️ Kupon stack deployed:", {
      registry: registry.address,
      compliance: compliance.address,
      token: token.address,
    });
  },
  {
    // e.g. yarn deploy --tags Kupon
    tags: ["Kupon"],
  },
);
