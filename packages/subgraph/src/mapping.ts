import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  ClaimGranted as ClaimGrantedEvent,
  ClaimRevoked as ClaimRevokedEvent,
} from "../generated/KuponClaimRegistry/KuponClaimRegistry";
import { Transfer as TransferEventSchema } from "../generated/KuponToken/KuponToken";
import { ClaimEvent, TransferEvent, InvestorComplianceState } from "../generated/schema";

const RESIDENCY_HEX = "0xa81c4e74017d23d83b4ab0f7b0e1e6955a6d7132a27ea80f64c62252a129ef26";

function getOrCreateInvestor(account: Bytes, timestamp: BigInt): InvestorComplianceState {
  let investor = InvestorComplianceState.load(account);
  if (investor == null) {
    investor = new InvestorComplianceState(account);
    investor.hasResidency = false;
    investor.hasAccredited = false;
    investor.balance = BigInt.fromI32(0);
    investor.updatedAtTimestamp = timestamp;
  }
  return investor;
}

export function handleClaimGranted(event: ClaimGrantedEvent): void {
  let id = event.transaction.hash.concatI32(event.logIndex.toI32());
  let entity = new ClaimEvent(id);
  entity.account = event.params.account;
  entity.claim = event.params.claim;
  entity.action = "GRANTED";
  entity.claimType =
    event.params.claim.toHexString().toLowerCase() == RESIDENCY_HEX.toLowerCase()
      ? "RESIDENCY_ID"
      : "ACCREDITED";
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();

  let investor = getOrCreateInvestor(event.params.account, event.block.timestamp);
  if (entity.claimType == "RESIDENCY_ID") {
    investor.hasResidency = true;
  } else {
    investor.hasAccredited = true;
  }
  investor.updatedAtTimestamp = event.block.timestamp;
  investor.save();
}

export function handleClaimRevoked(event: ClaimRevokedEvent): void {
  let id = event.transaction.hash.concatI32(event.logIndex.toI32());
  let entity = new ClaimEvent(id);
  entity.account = event.params.account;
  entity.claim = event.params.claim;
  entity.action = "REVOKED";
  entity.claimType =
    event.params.claim.toHexString().toLowerCase() == RESIDENCY_HEX.toLowerCase()
      ? "RESIDENCY_ID"
      : "ACCREDITED";
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();

  let investor = getOrCreateInvestor(event.params.account, event.block.timestamp);
  if (entity.claimType == "RESIDENCY_ID") {
    investor.hasResidency = false;
  } else {
    investor.hasAccredited = false;
  }
  investor.updatedAtTimestamp = event.block.timestamp;
  investor.save();
}

export function handleTransfer(event: TransferEventSchema): void {
  let id = event.transaction.hash.concatI32(event.logIndex.toI32());
  let entity = new TransferEvent(id);
  entity.from = event.params.from;
  entity.to = event.params.to;
  entity.value = event.params.value;
  entity.blockNumber = event.block.number;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.save();

  let sender = getOrCreateInvestor(event.params.from, event.block.timestamp);
  if (sender.balance >= event.params.value) {
    sender.balance = sender.balance.minus(event.params.value);
  }
  sender.updatedAtTimestamp = event.block.timestamp;
  sender.save();

  let recipient = getOrCreateInvestor(event.params.to, event.block.timestamp);
  recipient.balance = recipient.balance.plus(event.params.value);
  recipient.updatedAtTimestamp = event.block.timestamp;
  recipient.save();
}
