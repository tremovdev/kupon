/**
 * The Graph Client Service for Kupon Regulatory Audit Trail
 * Fetches indexed ClaimEvents and TransferEvents from The Graph Subgraph.
 */

export interface SubgraphClaimEvent {
  id: string;
  account: string;
  claim: string;
  claimType: "RESIDENCY_ID" | "ACCREDITED";
  action: "GRANTED" | "REVOKED";
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface SubgraphTransferEvent {
  id: string;
  from: string;
  to: string;
  value: string;
  blockNumber: string;
  blockTimestamp: string;
  transactionHash: string;
}

export interface RegulatoryAuditTrailResponse {
  claimEvents: SubgraphClaimEvent[];
  transferEvents: SubgraphTransferEvent[];
}

const DEFAULT_SUBGRAPH_URL =
  process.env.NEXT_PUBLIC_THE_GRAPH_ENDPOINT || "https://api.studio.thegraph.com/query/kupon/kupon-rwa/version/latest";

const AUDIT_QUERY = `
  query GetRegulatoryAuditTrail {
    claimEvents(first: 25, orderBy: blockTimestamp, orderDirection: desc) {
      id
      account
      claim
      claimType
      action
      blockNumber
      blockTimestamp
      transactionHash
    }
    transferEvents(first: 25, orderBy: blockTimestamp, orderDirection: desc) {
      id
      from
      to
      value
      blockNumber
      blockTimestamp
      transactionHash
    }
  }
`;

export async function fetchRegulatoryAuditTrail(
  endpointUrl: string = DEFAULT_SUBGRAPH_URL,
): Promise<RegulatoryAuditTrailResponse | null> {
  try {
    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: AUDIT_QUERY }),
      // Short timeout to fallback immediately if subgraph is unreachable
      signal: AbortSignal.timeout(3500),
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    if (json.errors || !json.data) {
      return null;
    }

    return json.data as RegulatoryAuditTrailResponse;
  } catch {
    // Gracefully return null on network/CORS failure so consumer falls back to RPC
    return null;
  }
}
