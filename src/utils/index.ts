import { BigInt, ethereum } from "@graphprotocol/graph-ts";
import { Position } from "../types/schema";
import { Transaction } from "../types/schema";

export function loadTransaction(
  event: ethereum.Event,
  key: string,
  position: Position
): Transaction {
  let transaction = Transaction.load(event.transaction.hash.toHexString());
  if (transaction === null) {
    transaction = new Transaction(event.transaction.hash.toHexString());
  }
  transaction.blockNumber = event.block.number;
  transaction.timestamp = event.block.timestamp;
  if (event.receipt) {
    transaction.gasUsed = BigInt.fromI32(0); // event.receipt.gasUsed; // Uncomment if you want to use gasUsed from receipt
  } else {
    transaction.gasUsed = BigInt.fromI32(0);
  }
  transaction.key = key;
  transaction.gasPrice = event.transaction.gasPrice;
  transaction.save();
  if (position) {
    transaction.position = position.id; // Link transaction to position
    let positionTransactions = position.transactions || [];
    positionTransactions.push(transaction.id);
    position.transactions = positionTransactions;
  }
  return transaction as Transaction;
}
