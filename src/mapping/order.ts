import { BigInt, log } from "@graphprotocol/graph-ts";
import {
  OrderCreated,
  OrderDeposit,
  OrderWithdraw,
  OrderAliveStatus,
  OrderModified,
} from "../types/MarginModule/MarginModule";
import { Order, Token, WhiteList } from "../types/schema";
import { MarginModule } from "../types/MarginModule/MarginModule";
import {
  fetchToken,
  fetchTokenAddress,
  fetchArrayTokens,
  toFormatValue,
} from "../utils/token";
import { fetchToekenList } from "../utils/tokenlist";

function exportOrder(event: OrderCreated): Order | null {
  const id = event.params.orderId.toString();
  const contract = MarginModule.bind(event.address);
  const data = contract.orders(event.params.orderId);
  const collateralsArray = contract.getCollaterals(event.params.orderId);
  const whitelistedId = data.getWhitelist(); // bytes32
  const whitelistedTokens = fetchToekenList(whitelistedId, event.address); // WhiteList
  let collateraTokens = fetchArrayTokens(collateralsArray);
  let order = Order.load(id);
  if (order == null) {
    order = new Order(id);
  }

  let collateraStrings = new Array<string>();
  for (let i = 0; i < collateralsArray.length; i++) {
    collateraStrings.push(collateralsArray[i].toHexString());
  }
  order.collaterals = collateraStrings; // address[]
  let collateralIds = new Array<string>();

  for (let i = 0; i < collateraTokens.length; i++) {
    let token = collateraTokens[i];
    collateralIds[i] = token.id; // address
  }
  order.collateralTokens = collateralIds; // address[]
  order.owner = data.getOwner();
  order.whitelist = whitelistedTokens.id; // address
  order.interestRate = data.getInterestRate(); // uint256
  order.duration = data.getDuration(); // uint256
  order.minLoan = data.getMinLoan(); // uint256
  order.deadline = data.getExpirationData().deadline; // uint256
  let expirationData = data.getExpirationData();

  order.liquidationRewardAmount = expirationData.liquidationRewardAmount; // uint256
  order.liquidationRewardAsset = expirationData.liquidationRewardAsset.toHexString(); // address

  let liquidationRewardAssetPair = fetchTokenAddress(
    expirationData.liquidationRewardAsset
  ); // [Address, Address]
  const liquidationRewardAssetToken = fetchToken(
    liquidationRewardAssetPair.addressERC20,
    liquidationRewardAssetPair.addressERC223
  );

  order.liquidationRewardAssetToken = liquidationRewardAssetToken.id; // address

  order.baseAsset = data.getBaseAsset(); // address
  let baseAssetPair = fetchTokenAddress(data.getBaseAsset()); // [Address, Address]
  let baseAssetToken = fetchToken(
    baseAssetPair.addressERC20,
    baseAssetPair.addressERC223
  );

  order.baseAssetToken = baseAssetToken.id; // address
  order.balance = data.getBalance(); // uint256
  order.currencyLimit = BigInt.fromI32(data.getCurrencyLimit()); // uint16
  order.leverage = BigInt.fromI32(data.getLeverage()); // uint8

  order.createdAt = event.block.timestamp;
  order.updatedAt = event.block.timestamp;

  // // Convert BigInt to number
  if (baseAssetToken.decimals === null) {
    log.warning("Base asset token decimals not found for order: {}", [id]);
    return null;
  }
  let balanceBD = toFormatValue(order.balance, baseAssetToken.decimals!);
  let minLoanBD = toFormatValue(order.minLoan, baseAssetToken.decimals!);
  order.balanceFormatted = balanceBD;
  order.minLoanFormatted = minLoanBD;
  // order.save();
  return order;
}

export function handleOrderCreated(event: OrderCreated): void {
  let order = exportOrder(event);
  if (!order) {
    log.warning("Order not created for event: {}", [
      event.transaction.hash.toHexString(),
    ]);
    return;
  }
  order.alive = true;
  order.save();
}

export function handleOrderDeposit(event: OrderDeposit): void {
  let id = event.params.orderId.toString();
  let order = Order.load(id);
  if (!order) return;
  let balance = order.balance.plus(event.params.amount);
  order.balance = balance;
  let baseAssetToken = Token.load(order.baseAssetToken);
  if (!baseAssetToken) {
    log.warning("Base asset token not found for order: {}", [id]);
    return;
  }
  order.balanceFormatted = toFormatValue(balance, baseAssetToken.decimals);
  order.updatedAt = event.block.timestamp;
  order.save();
}

export function handleOrderWithdraw(event: OrderWithdraw): void {
  let id = event.params.orderId.toString();
  let order = Order.load(id);
  if (!order) return;
  let balance = order.balance.minus(event.params.amount);
  order.balance = balance;
  let baseAssetToken = Token.load(order.baseAssetToken);
  if (!baseAssetToken) {
    log.warning("Base asset token not found for order: {}", [id]);
    return;
  }
  order.balanceFormatted = toFormatValue(balance, baseAssetToken.decimals);
  order.updatedAt = event.block.timestamp;
  order.save();
}

export function handleOrderAliveStatus(event: OrderAliveStatus): void {
  const id = event.params.orderId.toString();
  let order = Order.load(id);
  if (!order) {
    log.warning("Order with id {} not found for OrderAliveStatus event: {}", [
      id,
      event.transaction.hash.toHexString(),
    ]);
    return;
  }
  order.alive = event.params.alive;
  order.updatedAt = event.block.timestamp;
  order.save();
  // log.info("Order {} alive status updated to {}", [id, order.alive.to
}

export function handleOrderModified(event: OrderModified): void {
  let order = exportOrder(changetype<OrderCreated>(event));
  if (!order) {
    log.warning("Order not modified for event: {}", [
      event.transaction.hash.toHexString(),
    ]);
    return;
  }
  order.save();
}
