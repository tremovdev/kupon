import { Abi, PublicClient, createPublicClient, fallback, http } from "viem";
import { baseSepolia } from "viem/chains";

interface SafeContractEventsParams {
  publicClient: PublicClient;
  address: `0x${string}`;
  abi: Abi;
  eventName: string;
  chunks?: number;
  chunkSize?: bigint;
}

// Dedicated public RPC transport for Base Sepolia event indexing.
// Bypasses Alchemy Free Tier's restrictive 10-block eth_getLogs limit
// by using the official Coinbase/Base Sepolia RPC and PublicNode (both supporting 10,000 blocks).
const baseSepoliaLogsClient = createPublicClient({
  chain: baseSepolia,
  transport: fallback([http("https://base-sepolia-rpc.publicnode.com"), http("https://sepolia.base.org")]),
});

/**
 * Safely queries contract events across block ranges without violating
 * public RPC limits (such as Base Sepolia's 10,000 block range limit on eth_getLogs).
 * Automatically chunks queries into safe windows (default: 8,000 blocks per chunk)
 * and falls back to a single 0n query on local networks.
 */
export async function getSafeContractEvents({
  publicClient,
  address,
  abi,
  eventName,
  chunks = 4, // 4 chunks * 8,000 blocks = ~32,000 blocks (~18 hours of activity on Base 2s blocks)
  chunkSize = 8000n,
}: SafeContractEventsParams) {
  try {
    const isBaseSepolia = publicClient?.chain?.id === 84532;
    // Use the dedicated Base Sepolia client to ensure Alchemy Free Tier's 10-block limit is never hit
    const clientToUse = isBaseSepolia ? (baseSepoliaLogsClient as unknown as PublicClient) : publicClient;

    const currentBlock = await clientToUse.getBlockNumber();

    // On local chains (Hardhat / Anvil) with small block heights, query from 0 directly
    if (currentBlock <= chunkSize) {
      return await clientToUse.getContractEvents({
        address,
        abi,
        eventName,
        fromBlock: 0n,
        toBlock: currentBlock,
      });
    }

    // On public testnets, split into parallel chunks under the 10,000 block limit
    const promises = [];
    for (let i = 0; i < chunks; i++) {
      const toBlock = currentBlock - BigInt(i) * chunkSize;
      if (toBlock <= 0n) break;
      const fromBlock = toBlock > chunkSize ? toBlock - chunkSize : 0n;

      promises.push(
        clientToUse
          .getContractEvents({
            address,
            abi,
            eventName,
            fromBlock,
            toBlock,
          })
          .catch(err => {
            console.warn(`Chunk ${i} query failed for ${eventName}:`, err);
            return [];
          }),
      );

      if (fromBlock === 0n) break;
    }

    const results = await Promise.all(promises);
    return results.flat();
  } catch (err) {
    console.warn(`Safe contract events query failed for ${eventName}:`, err);
    return [];
  }
}
