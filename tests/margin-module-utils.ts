import { newMockEvent } from "matchstick-as";
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts";
import {
  InitialLeverage,
  MarginSwap,
  OrderAliveStatus,
  OrderCreated,
  OrderDeposit,
  OrderWithdraw,
  PositionClosed,
  PositionDeposit,
  PositionFrozen,
  PositionLiquidated,
  PositionOpened,
  PositionWithdrawal,
} from "../src/types/MarginModule/MarginModule";

export function createMarginSwapEvent(
  positionId: BigInt,
  assetIn: Address,
  assetOut: Address,
  amountIn: BigInt,
  amountOut: BigInt
): MarginSwap {
  let marginSwapEvent = changetype<MarginSwap>(newMockEvent());

  marginSwapEvent.parameters = new Array();

  marginSwapEvent.parameters.push(
    new ethereum.EventParam(
      "positionId",
      ethereum.Value.fromUnsignedBigInt(positionId)
    )
  );
  marginSwapEvent.parameters.push(
    new ethereum.EventParam("assetIn", ethereum.Value.fromAddress(assetIn))
  );
  marginSwapEvent.parameters.push(
    new ethereum.EventParam("assetOut", ethereum.Value.fromAddress(assetOut))
  );
  marginSwapEvent.parameters.push(
    new ethereum.EventParam(
      "amountIn",
      ethereum.Value.fromUnsignedBigInt(amountIn)
    )
  );
  marginSwapEvent.parameters.push(
    new ethereum.EventParam(
      "amountOut",
      ethereum.Value.fromUnsignedBigInt(amountOut)
    )
  );

  return marginSwapEvent;
}

export function createOrderCreatedEvent(
  orderId: BigInt,
  owner: Address,
  baseAsset: Address,
  interestRate: BigInt,
  duration: BigInt,
  minLoan: BigInt,
  leverage: i32
): OrderCreated {
  let orderCreatedEvent = changetype<OrderCreated>(newMockEvent());

  orderCreatedEvent.parameters = new Array();

  orderCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "orderId",
      ethereum.Value.fromUnsignedBigInt(orderId)
    )
  );
  orderCreatedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  );
  orderCreatedEvent.parameters.push(
    new ethereum.EventParam("baseAsset", ethereum.Value.fromAddress(baseAsset))
  );
  orderCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "interestRate",
      ethereum.Value.fromUnsignedBigInt(interestRate)
    )
  );
  orderCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "duration",
      ethereum.Value.fromUnsignedBigInt(duration)
    )
  );
  orderCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "minLoan",
      ethereum.Value.fromUnsignedBigInt(minLoan)
    )
  );
  orderCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "leverage",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(leverage))
    )
  );

  return orderCreatedEvent;
}

export function createOrderDepositEvent(
  orderId: BigInt,
  asset: Address,
  amount: BigInt
): OrderDeposit {
  let orderDepositEvent = changetype<OrderDeposit>(newMockEvent());

  orderDepositEvent.parameters = new Array();

  orderDepositEvent.parameters.push(
    new ethereum.EventParam(
      "orderId",
      ethereum.Value.fromUnsignedBigInt(orderId)
    )
  );
  orderDepositEvent.parameters.push(
    new ethereum.EventParam("asset", ethereum.Value.fromAddress(asset))
  );
  orderDepositEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  );

  return orderDepositEvent;
}

export function createOrderWithdrawEvent(
  orderId: BigInt,
  asset: Address,
  amount: BigInt
): OrderWithdraw {
  let orderWithdrawEvent = changetype<OrderWithdraw>(newMockEvent());

  orderWithdrawEvent.parameters = new Array();

  orderWithdrawEvent.parameters.push(
    new ethereum.EventParam(
      "orderId",
      ethereum.Value.fromUnsignedBigInt(orderId)
    )
  );
  orderWithdrawEvent.parameters.push(
    new ethereum.EventParam("asset", ethereum.Value.fromAddress(asset))
  );
  orderWithdrawEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  );

  return orderWithdrawEvent;
}

export function createPositionDepositEvent(
  positionId: BigInt,
  asset: Address,
  amount: BigInt
): PositionDeposit {
  let positionDepositEvent = changetype<PositionDeposit>(newMockEvent());

  positionDepositEvent.parameters = new Array();

  positionDepositEvent.parameters.push(
    new ethereum.EventParam(
      "positionId",
      ethereum.Value.fromUnsignedBigInt(positionId)
    )
  );
  positionDepositEvent.parameters.push(
    new ethereum.EventParam("asset", ethereum.Value.fromAddress(asset))
  );
  positionDepositEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  );

  return positionDepositEvent;
}

export function createPositionFrozenEvent(
  positionId: BigInt,
  liquidator: Address,
  timestamp: BigInt
): PositionFrozen {
  let positionFrozenEvent = changetype<PositionFrozen>(newMockEvent());

  positionFrozenEvent.parameters = new Array();

  positionFrozenEvent.parameters.push(
    new ethereum.EventParam(
      "positionId",
      ethereum.Value.fromUnsignedBigInt(positionId)
    )
  );
  positionFrozenEvent.parameters.push(
    new ethereum.EventParam(
      "liquidator",
      ethereum.Value.fromAddress(liquidator)
    )
  );
  positionFrozenEvent.parameters.push(
    new ethereum.EventParam(
      "timestamp",
      ethereum.Value.fromUnsignedBigInt(timestamp)
    )
  );

  return positionFrozenEvent;
}

export function createPositionLiquidatedEvent(
  positionId: BigInt,
  liquidator: Address,
  rewardAmount: BigInt
): PositionLiquidated {
  let positionLiquidatedEvent = changetype<PositionLiquidated>(newMockEvent());

  positionLiquidatedEvent.parameters = new Array();

  positionLiquidatedEvent.parameters.push(
    new ethereum.EventParam(
      "positionId",
      ethereum.Value.fromUnsignedBigInt(positionId)
    )
  );
  positionLiquidatedEvent.parameters.push(
    new ethereum.EventParam(
      "liquidator",
      ethereum.Value.fromAddress(liquidator)
    )
  );
  positionLiquidatedEvent.parameters.push(
    new ethereum.EventParam(
      "rewardAmount",
      ethereum.Value.fromUnsignedBigInt(rewardAmount)
    )
  );

  return positionLiquidatedEvent;
}

export function createPositionOpenedEvent(
  positionId: BigInt,
  owner: Address,
  loanAmount: BigInt,
  baseAsset: Address,
  collateral: Address,
  collateralAmount: BigInt
): PositionOpened {
  // NOTE: the previous version of this helper pushed (positionId, orderId, owner, collateralAsset,
  // loanAmount, collateralAmount), which does not match the event. graph-ts reads parameters
  // positionally, so it produced type-mismatched values. Order now follows the ABI:
  // PositionOpened(positionId, owner, loanAmount, baseAsset, collateral, collateral_amount)
  let event = changetype<PositionOpened>(newMockEvent());
  event.parameters = new Array();
  event.parameters.push(
    new ethereum.EventParam("positionId", ethereum.Value.fromUnsignedBigInt(positionId))
  );
  event.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  );
  event.parameters.push(
    new ethereum.EventParam("loanAmount", ethereum.Value.fromUnsignedBigInt(loanAmount))
  );
  event.parameters.push(
    new ethereum.EventParam("baseAsset", ethereum.Value.fromAddress(baseAsset))
  );
  event.parameters.push(
    new ethereum.EventParam("collateral", ethereum.Value.fromAddress(collateral))
  );
  event.parameters.push(
    new ethereum.EventParam(
      "collateral_amount",
      ethereum.Value.fromUnsignedBigInt(collateralAmount)
    )
  );
  return event;
}

export function createInitialLeverageEvent(
  positionId: BigInt,
  leverage: BigInt
): InitialLeverage {
  let event = changetype<InitialLeverage>(newMockEvent());
  event.parameters = new Array();
  event.parameters.push(
    new ethereum.EventParam("positionId", ethereum.Value.fromUnsignedBigInt(positionId))
  );
  event.parameters.push(
    new ethereum.EventParam("leverage", ethereum.Value.fromUnsignedBigInt(leverage))
  );
  return event;
}

export function createPositionClosedEvent(
  positionId: BigInt,
  closedBy: Address
): PositionClosed {
  let event = changetype<PositionClosed>(newMockEvent());
  event.parameters = new Array();
  event.parameters.push(
    new ethereum.EventParam("positionId", ethereum.Value.fromUnsignedBigInt(positionId))
  );
  event.parameters.push(
    new ethereum.EventParam("closedBy", ethereum.Value.fromAddress(closedBy))
  );
  return event;
}

export function createPositionWithdrawalEvent(
  positionId: BigInt,
  asset: Address,
  amount: BigInt
): PositionWithdrawal {
  let event = changetype<PositionWithdrawal>(newMockEvent());
  event.parameters = new Array();
  event.parameters.push(
    new ethereum.EventParam("positionId", ethereum.Value.fromUnsignedBigInt(positionId))
  );
  event.parameters.push(
    new ethereum.EventParam("asset", ethereum.Value.fromAddress(asset))
  );
  event.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  );
  return event;
}

export function createOrderAliveStatusEvent(
  orderId: BigInt,
  alive: boolean
): OrderAliveStatus {
  let event = changetype<OrderAliveStatus>(newMockEvent());
  event.parameters = new Array();
  event.parameters.push(
    new ethereum.EventParam("orderId", ethereum.Value.fromUnsignedBigInt(orderId))
  );
  event.parameters.push(
    new ethereum.EventParam("alive", ethereum.Value.fromBoolean(alive))
  );
  return event;
}
