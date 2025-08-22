import {
  PositionOpened,
  PositionDeposit,
  PositionFrozen,
  PositionClosed,
  PositionWithdrawal,
  PositionLiquidated,
} from "../types/MarginModule/MarginModule";
// import { fetchTokenAddress, fetchToken } from "../utils/token";

import {
  Order,
  Position,
  PositionOpenedTx,
  PositionDepositTx,
  PositionFrozenTx,
  PositionWithdrawalTx,
  PositionClosedTx,
  PositionLiquidatedTx,
} from "../types/schema";
import { MarginModule } from "../types/MarginModule/MarginModule";
import { log } from "matchstick-as";
import { fetchToken, fetchTokenAddress, toFormatValue } from "../utils/token";
import { loadTransaction } from "../utils";
import { updatePositionAssets, findAssetToken } from "../utils/assets";

export function handlePositionOpened(event: PositionOpened): void {
  const id = event.params.positionId;
  // let id = rawId.minus(BigInt.fromI32(1)); // positionId starts from 1, but in graph we use 0 as first id
  let position = new Position(id.toString());
  const contract = MarginModule.bind(event.address);
  const data = contract.try_positions(id);
  if (data.reverted) {
    log.warning("Position with id {} not found for PositionOpened event: {}", [
      id.toString(),
      event.transaction.hash.toHexString(),
    ]);
    return;
  }
  const orderId = data.value.getOrderId().toString();
  let order = Order.load(orderId);
  if (!order) {
    return;
  }

  position.owner = data.value.getOwner();
  position.deadline = data.value.getDeadline();
  position.createdAt = data.value.getCreatedAt();
  position.updatedAt = event.block.timestamp;
  position.loanAmount = event.params.loanAmount;

  position.order = order.id;
  position.initialBalance = data.value.getInitialBalance();
  position.interest = data.value.getInterest();
  // pos.paidDays = data.value.getPaidDays();
  position.frozenTime = data.value.getFrozenTime();
  position.liquidator = data.value.getLiquidator();
  const collateralTokenPoolAddress = fetchTokenAddress(event.params.collateral);
  const collateralToken = fetchToken(
    collateralTokenPoolAddress.addressERC20,
    collateralTokenPoolAddress.addressERC223
  );

  position.collateral = event.params.collateral.toHexString();
  position.collateralToken = collateralToken.id;
  position.collateralAmount = event.params.collateral_amount;

  const baseAssetTokenPoolAddress = fetchTokenAddress(event.params.baseAsset);
  const baseAssetToken = fetchToken(
    baseAssetTokenPoolAddress.addressERC20,
    baseAssetTokenPoolAddress.addressERC223
  );
  position.baseAsset = event.params.baseAsset;
  position.baseAssetToken = baseAssetToken.id;
  updatePositionAssets(position, contract);
  position.isClosed = false;
  position.isLiquidated = false; // устанавливаем флаг, что позиция не ликвидирована

  let balance = order.balance.minus(event.params.loanAmount);
  order.balance = balance;
  order.balanceFormatted = toFormatValue(balance, baseAssetToken.decimals);
  position.transactions = [];

  let tx = loadTransaction(event, "PositionOpened", position);
  let positionOpenedTx = new PositionOpenedTx(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  positionOpenedTx.positionId = id;
  positionOpenedTx.owner = event.params.owner;
  positionOpenedTx.loanAmount = event.params.loanAmount;
  positionOpenedTx.baseAsset = event.params.baseAsset;
  positionOpenedTx.timestamp = event.block.timestamp;
  positionOpenedTx.blockNumber = event.block.number;
  positionOpenedTx.transaction = tx.id;
  positionOpenedTx.baseAssetToken = baseAssetToken.id;
  positionOpenedTx.save();
  position.save();
  order.save();
}

export function handlePositionDeposit(event: PositionDeposit): void {
  const id = event.params.positionId;
  let position = Position.load(id.toString());
  if (position == null) return;
  position.updatedAt = event.block.timestamp;
  const contract = MarginModule.bind(event.address);
  updatePositionAssets(position, contract);

  let tx = loadTransaction(event, "PositionDeposit", position);
  let positionDepositTx = new PositionDepositTx(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  const asset = event.params.asset.toHexString();
  positionDepositTx.positionId = event.params.positionId;
  positionDepositTx.asset = asset;
  positionDepositTx.assetToken = findAssetToken(position, asset);
  positionDepositTx.amount = event.params.amount;
  positionDepositTx.timestamp = event.block.timestamp;
  positionDepositTx.blockNumber = event.block.number;
  positionDepositTx.transaction = tx.id;

  positionDepositTx.save();

  position.save();
}

export function handlePositionFrozen(event: PositionFrozen): void {
  const id = event.params.positionId.toString();
  const liquidator = event.params.liquidator;
  let position = Position.load(id);
  if (position == null) return;
  // pos.open = false;
  position.frozenTime = event.params.timestamp;
  position.liquidator = liquidator;
  position.updatedAt = event.block.timestamp;
  position.txFrozen = event.transaction.hash.toHexString();
  let tx = loadTransaction(event, "PositionFrozen", position);
  let positionFrozenTx = new PositionFrozenTx(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  event.params.positionId.toString();
  positionFrozenTx.positionId = event.params.positionId;
  positionFrozenTx.liquidator = liquidator;
  positionFrozenTx.timestamp = event.block.timestamp;
  positionFrozenTx.blockNumber = event.block.number;
  positionFrozenTx.transaction = tx.id;
  positionFrozenTx.save();
  position.save();
}

export function handlePositionLiquidated(event: PositionLiquidated): void {
  const id = event.params.positionId.toString();
  let position = Position.load(id);
  if (position == null) return;
  const contract = MarginModule.bind(event.address);
  const data = contract.try_positions(event.params.positionId);
  const liquidator = data.value.getLiquidator();
  position.liquidator = liquidator; // liquidator как Bytes, не строка!
  position.updatedAt = event.block.timestamp;
  position.isLiquidated = true;
  position.liquidatedAt = event.block.timestamp;
  position.txLiquidated = event.transaction.hash.toHexString();
  let tx = loadTransaction(event, "PositionLiquidated", position);

  let liquidatedTx = new PositionLiquidatedTx(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  liquidatedTx.positionId = event.params.positionId;
  liquidatedTx.liquidator = liquidator; // тип Bytes
  liquidatedTx.timestamp = event.block.timestamp;
  liquidatedTx.blockNumber = event.block.number;
  liquidatedTx.transaction = tx.id;
  liquidatedTx.save();
  position.save();
}

export function handlePositionClosed(event: PositionClosed): void {
  let id = event.params.positionId;
  let position = Position.load(id.toString());
  if (position == null) return;
  const contract = MarginModule.bind(event.address);
  updatePositionAssets(position, contract);
  position.txClosed = event.transaction.hash.toHexString();
  position.isClosed = true; // устанавливаем флаг, что позиция закрыта
  position.closedAt = event.block.timestamp; // сохраняем время закрытия позиции
  position.updatedAt = event.block.timestamp;
  let tx = loadTransaction(event, "PositionClosed", position);
  let positionClosedTx = new PositionClosedTx(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  positionClosedTx.positionId = event.params.positionId;
  positionClosedTx.closedBy = event.params.closedBy;
  positionClosedTx.timestamp = event.block.timestamp;
  positionClosedTx.blockNumber = event.block.number;
  positionClosedTx.transaction = tx.id;
  positionClosedTx.save();
  position.save();
}

export function handlePositionWithdrawal(event: PositionWithdrawal): void {
  let id = event.params.positionId;
  let position = Position.load(id.toString());
  if (position == null) return;

  position.updatedAt = event.block.timestamp;
  const contract = MarginModule.bind(event.address);
  const asset = event.params.asset.toHexString();
  updatePositionAssets(position, contract);
  let tx = loadTransaction(event, "PositionWithdrawal", position);
  let positionWithdrawalTx = new PositionWithdrawalTx(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );

  positionWithdrawalTx.assetToken = findAssetToken(position, asset);
  positionWithdrawalTx.positionId = event.params.positionId;
  positionWithdrawalTx.asset = asset;
  positionWithdrawalTx.quantity = event.params.quantity;
  positionWithdrawalTx.timestamp = event.block.timestamp;
  positionWithdrawalTx.blockNumber = event.block.number;
  positionWithdrawalTx.transaction = tx.id;
  positionWithdrawalTx.save();
  position.save();
}
