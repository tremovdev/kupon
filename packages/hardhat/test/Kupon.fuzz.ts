import { expect } from "chai";
import { network } from "hardhat";

// SPEC Testing Strategy — the 3 fuzz invariants (JS-seeded, 200 runs, committed seed):
//   1. No transfer ever succeeds to a wallet lacking the required claim
//      (enforced by the per-action outcome prediction: contract and model must agree).
//   2. A retail wallet's balance never exceeds the cap through any transfer combination.
//   3. approve/transferFrom obey the same rules — no alternative-path bypass.
// Invariants 1-3 are checked against live on-chain state after every random action.
const { ethers, networkHelpers } = await network.create();

const RESIDENCY_ID = ethers.id("RESIDENCY_ID");
const ACCREDITED = ethers.id("ACCREDITED");

const SERIES_CAP = 100_000n * 10n ** 18n;
const ONE = 10n ** 18n;
const CAP = 5_000n * 10n ** 18n;

// Committed seed — JS-seeded fuzz per SPEC; rerunning reproduces the exact scenario.
const SEED = 20260906;
const RUNS = 200;

// Deterministic PRNG (mulberry32) so the whole run is reproducible from SEED alone.
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function deployFuzzFixture() {
  const [admin, ...wallets] = await ethers.getSigners();
  const registry = await (await ethers.getContractFactory("KuponClaimRegistry", admin)).deploy(admin.address);
  const compliance = await (
    await ethers.getContractFactory("KuponComplianceModule", admin)
  ).deploy(await registry.getAddress(), admin.address);
  const token = await (
    await ethers.getContractFactory("KuponToken", admin)
  ).deploy(await compliance.getAddress(), admin.address);
  return { registry, compliance, token, admin, wallets };
}

// TS mirror of the Solidity rule predicate used to PREDICT each random action's outcome.
// `from` is -1 for mints. If contract and model ever disagree, the run fails immediately.
function predictTransfer(
  balances: bigint[],
  claims: boolean[][],
  from: number,
  to: number,
  value: bigint,
  currentCap: bigint,
): { ok: boolean } {
  const toHasClaim = claims[to][0] || claims[to][1];
  if (!toHasClaim) return { ok: false }; // R1-RESIDENCY
  if (from !== -1 && !claims[from][0] && !claims[from][1]) return { ok: false }; // R3-FROZEN
  const retail = claims[to][0] && !claims[to][1];
  if (retail && balances[to] + value > currentCap) return { ok: false }; // R2-CAP
  return { ok: true };
}

describe("Kupon fuzz invariants (JS-seeded)", function () {
  it(`no-claim recipients never receive, retail never exceeds cap, transferFrom has no bypass (${RUNS} runs, seed ${SEED})`, async function () {
    const { registry, compliance, token, admin, wallets } = await networkHelpers.loadFixture(deployFuzzFixture);
    const rand = mulberry32(SEED);
    const W = wallets.length; // 19 wallets on the hardhat network
    const claims: boolean[][] = Array.from({ length: W }, () => [false, false]);
    const balances: bigint[] = Array.from({ length: W }, () => 0n);
    const acc = (i: number) => wallets[i].address;
    let currentCap = CAP;
    let supply = 0n;

    for (let i = 0; i < RUNS; i++) {
      const roll = rand();
      const w = Math.floor(rand() * W);
      const v = Math.floor(rand() * W);

      if (roll < 0.15) {
        // Random claim mutation — flips live freeze/unfreeze and retail/accredited status.
        const claimIdx = rand() < 0.7 ? 0 : 1;
        const claim = claimIdx === 0 ? RESIDENCY_ID : ACCREDITED;
        if (claims[w][claimIdx]) {
          await registry.revokeClaim(acc(w), claim);
          claims[w][claimIdx] = false;
        } else {
          await registry.grantClaim(acc(w), claim);
          claims[w][claimIdx] = true;
        }
      } else if (roll < 0.2) {
        // Admin changes the cap mid-run — live configuration must be honored immediately.
        currentCap = (1n + BigInt(Math.floor(rand() * 5_000))) * ONE;
        await compliance.connect(admin).setCap(currentCap);
      } else if (roll < 0.4) {
        // Issuance obeys the same gate; the series cap bounds total supply.
        const amount = BigInt(Math.floor(rand() * 300)) * ONE;
        const pred = predictTransfer(balances, claims, -1, w, amount, currentCap);
        const supplyAfter = supply + amount;
        if (!pred.ok) {
          await expect(token.issue(acc(w), amount)).to.be.revert(ethers);
        } else if (supplyAfter > SERIES_CAP) {
          await expect(token.issue(acc(w), amount)).to.be.revertedWithCustomError(token, "Kupon__SeriesCapExceeded");
        } else {
          await token.issue(acc(w), amount);
          balances[w] += amount;
          supply = supplyAfter;
        }
      } else if (roll < 0.75 || w === v) {
        // Direct transfer between two random wallets (self-transfer included).
        const amount = BigInt(1 + Math.floor(rand() * 600)) * ONE;
        const pred = predictTransfer(balances, claims, w, v, amount, currentCap);
        if (!pred.ok || amount > balances[w]) {
          await expect(token.connect(wallets[w]).transfer(acc(v), amount)).to.be.revert(ethers);
        } else {
          await token.connect(wallets[w]).transfer(acc(v), amount);
          balances[w] -= amount;
          balances[v] += amount;
        }
      } else {
        // transferFrom path: approve then transfer — must obey identical rules, no bypass.
        const amount = BigInt(1 + Math.floor(rand() * 100)) * ONE;
        await token.connect(wallets[w]).approve(wallets[v], amount);
        const u = Math.floor(rand() * W);
        const pred = predictTransfer(balances, claims, w, u, amount, currentCap);
        if (!pred.ok || amount > balances[w]) {
          await expect(token.connect(wallets[v]).transferFrom(acc(w), acc(u), amount)).to.be.revert(ethers);
        } else {
          await token.connect(wallets[v]).transferFrom(acc(w), acc(u), amount);
          balances[w] -= amount;
          balances[u] += amount;
        }
      }

      // Post-action invariants: model and chain agree; retail wallets never exceed the cap;
      // total supply never exceeds the series cap.
      for (let k = 0; k < W; k++) {
        const onChain = await token.balanceOf(acc(k));
        expect(onChain).to.equal(balances[k]); // no divergence between model and chain
        const retail = claims[k][0] && !claims[k][1];
        if (retail) {
          expect(onChain).to.be.at.most(currentCap);
        }
      }
      expect(await token.totalSupply()).to.equal(supply);
      expect(supply).to.be.at.most(SERIES_CAP);
    }
  });
});
