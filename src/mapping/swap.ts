import { Position, MarginSwapTx } from "../types/schema";
import { MarginSwap, MarginModule } from "../types/MarginModule/MarginModule";
import { log } from "matchstick-as";
import { loadTransaction } from "../utils";
import { updatePositionAssets, findAssetToken } from "../utils/assets";

export function handleMarginSwap(event: MarginSwap): void {
  const id = event.params.positionId.toString();
  let position = Position.load(id);
  if (!position) {
    log.warning("Position with id {} not found for MarginSwap event: {}", [
      id,
      event.transaction.hash.toHexString(),
    ]);
    return;
  }
  const contract = MarginModule.bind(event.address);
  updatePositionAssets(position, contract);
  position.updatedAt = event.block.timestamp;
  let tx = loadTransaction(event, "MarginSwap", position);
  let marginSwap = new MarginSwapTx(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  const assetIn = event.params.assetIn.toHexString();
  const assetOut = event.params.assetOut.toHexString();
  const assetInToken = findAssetToken(position, assetIn);
  const assetOutToken = findAssetToken(position, assetOut);
  if (assetInToken) {
    marginSwap.assetInToken = assetInToken;
  }
  if (assetOutToken) {
    marginSwap.assetOutToken = assetOutToken;
  }

  marginSwap.positionId = event.params.positionId;
  marginSwap.position = position.id;
  marginSwap.assetIn = assetIn;
  marginSwap.assetOut = assetOut;
  marginSwap.amountIn = event.params.amountIn;
  marginSwap.amountOut = event.params.amountOut;
  marginSwap.transaction = tx.id;
  marginSwap.timestamp = tx.timestamp;
  marginSwap.blockNumber = tx.blockNumber;

  position.save();
  marginSwap.save();
}
