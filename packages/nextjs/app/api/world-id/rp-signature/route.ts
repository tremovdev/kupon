import { NextResponse } from "next/server";
import { signRequest } from "@worldcoin/idkit-server";
import { privateKeyToAccount } from "viem/accounts";

// Dedicated signing key for Kupon World ID v4 RP verification
// Public Address: 0xe215d9513420c3ff852c7f4EC957991De62A6ED4
const DEFAULT_SIGNING_KEY =
  process.env.WORLD_RP_SIGNING_KEY || "0x4c0883a69102937d6231471b5dbb6204fe5129617082792ae468d01a0f367417";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "verify-residency-ksei";

    const sig = signRequest({
      signingKeyHex: DEFAULT_SIGNING_KEY,
      action: action,
    });

    const account = privateKeyToAccount(DEFAULT_SIGNING_KEY as `0x${string}`);

    return NextResponse.json({
      sig: sig.sig,
      nonce: sig.nonce,
      created_at: sig.createdAt,
      expires_at: sig.expiresAt,
      signer_address: account.address,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
