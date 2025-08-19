import { BigInt, store, Address } from "@graphprotocol/graph-ts";
import { log } from "matchstick-as";

import { MarginModule } from "../types/MarginModule/MarginModule";
import { Position, PositionAssets, Token } from "../types/schema";

import {
  fetchArrayTokens,
  fetchToken,
  fetchTokenAddress,
} from "../utils/token";

export function updatePositionAssets(
  pos: Position,
  contract: MarginModule
): void {
  const positionId = BigInt.fromString(pos.id);
  const assetsCall = contract.try_getPositionAssets(positionId);
  if (assetsCall.reverted) {
    log.warning("getPositionAssets call reverted for positionId: {}", [
      positionId.toString(),
    ]);
    return;
  }
  const balancesCall = contract.try_getPositionBalances(positionId);
  if (balancesCall.reverted) {
    log.warning("getPositionBalances call reverted for positionId: {}", [
      positionId.toString(),
    ]);
    return;
  }

  const assets = assetsCall.value;
  const balances = balancesCall.value;
  let assetIds = new Array<string>();
  for (let i = 0; i < assets.length; i++) {
    const addr = assets[i];
    const idKey = `${addr.toHexString()}-${positionId.toString()}`;
    const bal = balances[i];
    let ent = PositionAssets.load(idKey);
    if (!ent) {
      ent = new PositionAssets(idKey);
      ent.address = addr;
    }
    ent.balance = bal;
    ent.index = BigInt.fromI32(i + 1);
    ent.save();
    assetIds.push(idKey);
  }
  let assetsTokensIds = new Array<string>();
  // tokens
  const assetTokensPoolAddress = fetchArrayTokens(assets);
  for (let i = 0; i < assetTokensPoolAddress.length; i++) {
    const assetToken = assetTokensPoolAddress[i];
    assetsTokensIds.push(assetToken.id); // address
  }
  pos.assets = assetIds;
  pos.assetsTokens = assetsTokensIds; // address[]
}

export function findAssetToken(
  position: Position,
  assetAddress: string
): string {
  let assetsTokens = position.assetsTokens;
  if (!assetsTokens) {
    assetsTokens = [];
  }
  for (let i = 0; i < assetsTokens.length; i++) {
    if (assetsTokens[i].includes(assetAddress)) {
      return assetsTokens[i];
    }
  }
  let assetTokensPoolAddress = fetchTokenAddress(
    Address.fromString(assetAddress)
  ); // Ensure the token is fetched
  return fetchToken(
    assetTokensPoolAddress.addressERC20,
    assetTokensPoolAddress.addressERC223
  ).id; // Return the token ID
}
