import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll,
  createMockedFunction,
} from "matchstick-as/assembly/index";
import { BigInt, BigDecimal, Address, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { Order, Position, Token } from "../src/types/schema";
import { OrderModified } from "../src/types/MarginModule/MarginModule";
import { handleMarginSwap } from "../src/mapping/swap";
import {
  handleInitialLeverage,
  handlePositionFrozen,
  handlePositionLiquidated,
  handlePositionClosed,
  handlePositionWithdrawal,
  handlePositionDeposit,
  handlePositionOpened,
} from "../src/mapping/position";
import {
  handleOrderDeposit,
  handleOrderWithdraw,
  handleOrderAliveStatus,
  handleOrderCreated,
  handleOrderModified,
} from "../src/mapping/order";
import {
  createMarginSwapEvent,
  createInitialLeverageEvent,
  createOrderDepositEvent,
  createOrderWithdrawEvent,
  createPositionFrozenEvent,
  createPositionLiquidatedEvent,
  createPositionClosedEvent,
  createPositionWithdrawalEvent,
  createPositionDepositEvent,
  createOrderCreatedEvent,
  createOrderAliveStatusEvent,
  createPositionOpenedEvent,
} from "./margin-module-utils";

// NOTE: this file previously imported from
// "../dex-223-subgraph-margin-module-sepolia/generated/..." and "../src/margin-module", none of which
// exist in this repo - `yarn test` failed to compile. It also asserted on a "MarginSwap" entity, but the
// schema defines "MarginSwapTx", and it never created the Position that handleMarginSwap requires, so it
// could not have passed even once the imports were fixed.

const POSITION_ID = "234";
const TX_HASH = "0xa16081f360e3847006db660bae1c6d1b2e17ec2a"; // newMockEvent() default
const SWAP_ID = TX_HASH + "-1";
const ASSET = "0x0000000000000000000000000000000000000001";
const EVENT_ADDRESS = Address.fromString(TX_HASH); // newMockEvent() uses this as event.address too
const TOKEN_ID = ASSET + "-" + ASSET;
const CONVERTER = "0x5847f5c0e09182d9e75fe8b1617786f62fee0d9f"; // TOKEN_CONVERTER_ADDRESS

// updatePositionAssets() reads these two off the MarginModule. Matchstick panics on an unmocked call
// even for try_*, so they must be declared; reverting exercises the graceful-degradation branch.
function mockPositionReads(positionId: i32): void {
  createMockedFunction(
    EVENT_ADDRESS,
    "getPositionAssets",
    "getPositionAssets(uint256):(address[])"
  )
    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(positionId))])
    .reverts();
  createMockedFunction(
    EVENT_ADDRESS,
    "getPositionBalances",
    "getPositionBalances(uint256):(uint256[])"
  )
    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(positionId))])
    .reverts();
}

describe("handleMarginSwap", () => {
  afterAll(() => {
    clearStore();
  });

  describe("when the position exists", () => {
    beforeAll(() => {
      mockPositionReads(234);

      // Pre-seed the asset token so findAssetToken() matches on the position's own list instead of
      // falling through to TokenConverter/ERC-20 metadata lookups.
      const token = new Token(TOKEN_ID);
      token.addressERC20 = ASSET;
      token.addressERC223 = ASSET;
      token.symbol = "TST";
      token.name = "Test";
      token.decimals = BigInt.fromI32(18);
      token.save();

      // handleMarginSwap bails out unless the Position is already indexed.
      const position = new Position(POSITION_ID);
      position.assetsTokens = [TOKEN_ID];
      position.order = "1";
      position.owner = Bytes.fromHexString(ASSET);
      position.baseAsset = Bytes.fromHexString(ASSET);
      position.baseAssetToken = ASSET;
      position.isClosed = false;
      position.isLiquidated = false;
      position.createdAt = BigInt.fromI32(1);
      position.updatedAt = BigInt.fromI32(1);
      position.collateral = ASSET;
      position.collateralToken = ASSET;
      position.collateralAmount = BigInt.fromI32(0);
      position.transactions = [];
      position.save();

      handleMarginSwap(
        createMarginSwapEvent(
          BigInt.fromI32(234),
          Address.fromString(ASSET),
          Address.fromString(ASSET),
          BigInt.fromI32(234),
          BigInt.fromI32(234)
        )
      );
    });

    test("records a MarginSwapTx", () => {
      assert.entityCount("MarginSwapTx", 1);
      assert.fieldEquals("MarginSwapTx", SWAP_ID, "positionId", "234");
      assert.fieldEquals("MarginSwapTx", SWAP_ID, "position", POSITION_ID);
      assert.fieldEquals("MarginSwapTx", SWAP_ID, "assetIn", ASSET);
      assert.fieldEquals("MarginSwapTx", SWAP_ID, "assetOut", ASSET);
      assert.fieldEquals("MarginSwapTx", SWAP_ID, "amountIn", "234");
      assert.fieldEquals("MarginSwapTx", SWAP_ID, "amountOut", "234");
    });

    test("links the swap to a Transaction and bumps the position", () => {
      assert.fieldEquals("MarginSwapTx", SWAP_ID, "transaction", TX_HASH);
      assert.entityCount("Transaction", 1);
      assert.fieldEquals("Transaction", TX_HASH, "key", "MarginSwap");
    });
  });

  describe("when the position does not exist", () => {
    beforeAll(() => {
      clearStore();
      mockPositionReads(999);
      handleMarginSwap(
        createMarginSwapEvent(
          BigInt.fromI32(999),
          Address.fromString(ASSET),
          Address.fromString(ASSET),
          BigInt.fromI32(1),
          BigInt.fromI32(1)
        )
      );
    });

    test("ignores the event instead of creating an orphan record", () => {
      assert.entityCount("MarginSwapTx", 0);
    });
  });
});

describe("handleInitialLeverage", () => {
  beforeAll(() => {
    clearStore();
    const position = new Position(POSITION_ID);
    position.order = "1";
    position.owner = Bytes.fromHexString(ASSET);
    position.baseAsset = Bytes.fromHexString(ASSET);
    position.baseAssetToken = ASSET;
    position.isClosed = false;
    position.isLiquidated = false;
    position.createdAt = BigInt.fromI32(1);
    position.updatedAt = BigInt.fromI32(1);
    position.collateral = ASSET;
    position.collateralToken = ASSET;
    position.collateralAmount = BigInt.fromI32(0);
    position.transactions = [];
    position.save();
  });

  test("records the opening leverage on the position", () => {
    handleInitialLeverage(
      createInitialLeverageEvent(BigInt.fromI32(234), BigInt.fromI32(7))
    );
    assert.fieldEquals("Position", POSITION_ID, "leverage", "7");
  });

  test("ignores the event when the position is unknown", () => {
    handleInitialLeverage(
      createInitialLeverageEvent(BigInt.fromI32(999), BigInt.fromI32(3))
    );
    assert.notInStore("Position", "999");
  });
});

function seedPosition(id: string): Position {
  const position = new Position(id);
  position.order = "1";
  position.owner = Bytes.fromHexString(ASSET);
  position.baseAsset = Bytes.fromHexString(ASSET);
  position.baseAssetToken = ASSET;
  position.isClosed = false;
  position.isLiquidated = false;
  position.createdAt = BigInt.fromI32(1);
  position.updatedAt = BigInt.fromI32(1);
  position.collateral = ASSET;
  position.collateralToken = ASSET;
  position.collateralAmount = BigInt.fromI32(0);
  position.transactions = [];
  position.save();
  return position;
}

describe("handlePositionFrozen", () => {
  beforeAll(() => {
    clearStore();
    seedPosition(POSITION_ID);
    handlePositionFrozen(
      createPositionFrozenEvent(
        BigInt.fromI32(234),
        Address.fromString(ASSET),
        BigInt.fromI32(4242)
      )
    );
  });

  test("records the freeze on the position", () => {
    assert.fieldEquals("Position", POSITION_ID, "frozenTime", "4242");
    assert.fieldEquals("Position", POSITION_ID, "liquidator", ASSET);
  });

  test("writes a PositionFrozenTx", () => {
    assert.entityCount("PositionFrozenTx", 1);
  });
});

describe("handlePositionLiquidated", () => {
  test("does not crash the handler when positions() reverts", () => {
    clearStore();
    seedPosition(POSITION_ID);
    // The handler calls try_positions() but reads data.value without checking data.reverted -
    // handlePositionOpened does check. A reverting call must not take the subgraph down.
    createMockedFunction(
      Address.fromString(TX_HASH),
      "positions",
      "positions(uint256):(uint256,address,uint256,uint256,uint256,uint256,bool,uint256,address)"
    )
      .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(234))])
      .reverts();

    handlePositionLiquidated(
      createPositionLiquidatedEvent(
        BigInt.fromI32(234),
        Address.fromString(ASSET),
        BigInt.fromI32(1)
      )
    );
    // reaching here at all is the assertion: the handler must degrade, not abort
    assert.fieldEquals("Position", POSITION_ID, "id", POSITION_ID);
  });
});

const ORDER_ID = "1";

function seedOrder(): void {
  const token = new Token(TOKEN_ID);
  token.addressERC20 = ASSET;
  token.addressERC223 = ASSET;
  token.symbol = "TST";
  token.name = "Test";
  token.decimals = BigInt.fromI32(18);
  token.save();

  const order = new Order(ORDER_ID);
  order.owner = Bytes.fromHexString(ASSET);
  order.interestRate = BigInt.fromI32(10);
  order.duration = BigInt.fromI32(30);
  order.minLoan = BigInt.fromI32(1);
  order.minLoanFormatted = BigDecimal.fromString("1");
  order.balance = BigInt.fromI32(100);
  order.balanceFormatted = BigDecimal.fromString("100");
  order.baseAsset = Bytes.fromHexString(ASSET);
  order.baseAssetToken = TOKEN_ID;
  order.deadline = BigInt.fromI32(999999);
  order.createdAt = BigInt.fromI32(1);
  order.updatedAt = BigInt.fromI32(1);
  order.collaterals = [];
  order.collateralTokens = [];
  order.alive = true;
  order.save();
}

describe("order balance handlers", () => {
  test("deposit increases the order balance", () => {
    clearStore();
    seedOrder();
    handleOrderDeposit(
      createOrderDepositEvent(BigInt.fromI32(1), Address.fromString(ASSET), BigInt.fromI32(50))
    );
    assert.fieldEquals("Order", ORDER_ID, "balance", "150");
  });

  test("withdraw decreases the order balance", () => {
    clearStore();
    seedOrder();
    handleOrderWithdraw(
      createOrderWithdrawEvent(BigInt.fromI32(1), Address.fromString(ASSET), BigInt.fromI32(40))
    );
    assert.fieldEquals("Order", ORDER_ID, "balance", "60");
  });

  test("a deposit for an unknown order is ignored", () => {
    clearStore();
    handleOrderDeposit(
      createOrderDepositEvent(BigInt.fromI32(77), Address.fromString(ASSET), BigInt.fromI32(50))
    );
    assert.notInStore("Order", "77");
  });
});

describe("token lookup fallbacks", () => {
  test("a MarginSwap survives a reverting converter (no mapping abort)", () => {
    clearStore();
    mockPositionReads(234);
    // No Token preseeded and no assetsTokens on the position, so findAssetToken() falls through to
    // the converter: isWrapper -> predictWrapperAddress. Both revert here. getPredictAddress used to
    // read .value regardless, aborting the mapping and stopping the subgraph.
    createMockedFunction(
      Address.fromString(CONVERTER),
      "isWrapper",
      "isWrapper(address):(bool)"
    ).withArgs([ethereum.Value.fromAddress(Address.fromString(ASSET))]).reverts();
    createMockedFunction(
      Address.fromString(CONVERTER),
      "predictWrapperAddress",
      "predictWrapperAddress(address,bool):(address)"
    )
      .withArgs([
        ethereum.Value.fromAddress(Address.fromString(ASSET)),
        ethereum.Value.fromBoolean(true),
      ])
      .reverts();

    // fetchToken() then probes ERC-20 metadata; matchstick requires every call to be declared even
    // when it reverts, so the handler falls back to its "unknown" defaults.
    const A = Address.fromString(ASSET);
    createMockedFunction(A, "symbol", "symbol():(string)").reverts();
    createMockedFunction(A, "symbol", "symbol():(bytes32)").reverts();
    createMockedFunction(A, "name", "name():(string)").reverts();
    createMockedFunction(A, "name", "name():(bytes32)").reverts();
    createMockedFunction(A, "decimals", "decimals():(uint8)").reverts();

    seedPosition(POSITION_ID);
    handleMarginSwap(
      createMarginSwapEvent(
        BigInt.fromI32(234),
        Address.fromString(ASSET),
        Address.fromString(ASSET),
        BigInt.fromI32(1),
        BigInt.fromI32(1)
      )
    );
    // reaching this assertion means the mapping did not abort
    assert.entityCount("MarginSwapTx", 1);
  });
});

describe("order balance is recorded even without the token entity", () => {
  test("deposit still persists the raw balance", () => {
    clearStore();
    seedOrder();
    // point the order at a Token entity that does not exist; only balanceFormatted should suffer
    const order = Order.load(ORDER_ID)!;
    order.baseAssetToken = "0xmissing-token";
    order.save();
    handleOrderDeposit(
      createOrderDepositEvent(BigInt.fromI32(1), Address.fromString(ASSET), BigInt.fromI32(50))
    );
    assert.fieldEquals("Order", ORDER_ID, "balance", "150");
  });
});

// Seeds a position that already knows its asset token, so findAssetToken() matches locally instead of
// falling through to the converter and ERC-20 metadata lookups.
function seedPositionWithToken(id: string): void {
  const token = new Token(TOKEN_ID);
  token.addressERC20 = ASSET;
  token.addressERC223 = ASSET;
  token.symbol = "TST";
  token.name = "Test";
  token.decimals = BigInt.fromI32(18);
  token.save();
  const p = seedPosition(id);
  p.assetsTokens = [TOKEN_ID];
  p.save();
}

describe("handlePositionClosed", () => {
  beforeAll(() => {
    clearStore();
    mockPositionReads(234);
    seedPositionWithToken(POSITION_ID);
    handlePositionClosed(
      createPositionClosedEvent(BigInt.fromI32(234), Address.fromString(ASSET))
    );
  });

  test("marks the position closed and stamps the time", () => {
    assert.fieldEquals("Position", POSITION_ID, "isClosed", "true");
    assert.fieldEquals("Position", POSITION_ID, "txClosed", TX_HASH);
  });

  test("writes a PositionClosedTx", () => {
    assert.entityCount("PositionClosedTx", 1);
  });

  test("an unknown position is ignored", () => {
    clearStore();
    mockPositionReads(999);
    handlePositionClosed(
      createPositionClosedEvent(BigInt.fromI32(999), Address.fromString(ASSET))
    );
    assert.entityCount("PositionClosedTx", 0);
  });
});

describe("handlePositionWithdrawal", () => {
  beforeAll(() => {
    clearStore();
    mockPositionReads(234);
    seedPositionWithToken(POSITION_ID);
    handlePositionWithdrawal(
      createPositionWithdrawalEvent(
        BigInt.fromI32(234),
        Address.fromString(ASSET),
        BigInt.fromI32(500)
      )
    );
  });

  test("records the withdrawal", () => {
    assert.entityCount("PositionWithdrawalTx", 1);
  });
});

describe("handlePositionDeposit", () => {
  beforeAll(() => {
    clearStore();
    mockPositionReads(234);
    seedPositionWithToken(POSITION_ID);
    handlePositionDeposit(
      createPositionDepositEvent(
        BigInt.fromI32(234),
        Address.fromString(ASSET),
        BigInt.fromI32(700)
      )
    );
  });

  test("records the deposit", () => {
    assert.entityCount("PositionDepositTx", 1);
  });
});

describe("handleOrderCreated resilience", () => {
  test("a reverting orders() call skips the event instead of aborting the mapping", () => {
    clearStore();
    // exportOrder() used plain (non-try) contract calls; a revert aborted the mapping and stopped the
    // subgraph. It must now log and skip the single event instead.
    createMockedFunction(
      Address.fromString(TX_HASH),
      "orders",
      "orders(uint256):(address,uint256,bytes32,uint256,uint256,uint256,address,uint16,uint8,address,uint256,(uint256,address,uint32))"
    ).withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1))]).reverts();
    createMockedFunction(
      Address.fromString(TX_HASH),
      "getCollaterals",
      "getCollaterals(uint256):(address[])"
    ).withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1))]).reverts();

    handleOrderCreated(
      createOrderCreatedEvent(
        BigInt.fromI32(1),
        Address.fromString(ASSET),
        Address.fromString(ASSET),
        BigInt.fromI32(1),
        BigInt.fromI32(1),
        BigInt.fromI32(1),
        1
      )
    );
    // reaching this assertion at all means the mapping did not abort
    assert.entityCount("Order", 0);
  });
});

describe("handleOrderAliveStatus", () => {
  test("flips the alive flag on the order", () => {
    clearStore();
    seedOrder();
    assert.fieldEquals("Order", ORDER_ID, "alive", "true");
    handleOrderAliveStatus(createOrderAliveStatusEvent(BigInt.fromI32(1), false));
    assert.fieldEquals("Order", ORDER_ID, "alive", "false");
  });

  test("an unknown order is ignored", () => {
    clearStore();
    handleOrderAliveStatus(createOrderAliveStatusEvent(BigInt.fromI32(42), true));
    assert.notInStore("Order", "42");
  });
});

// Declares every call handlePositionOpened makes. Reverting the metadata lookups exercises the
// fallback paths; positions() returns real data so the entity can be asserted on.
function mockPositionOpenedCalls(positionId: i32, orderId: i32): void {
  const A = Address.fromString(ASSET);
  const EV = Address.fromString(TX_HASH);
  createMockedFunction(
    EV,
    "positions",
    "positions(uint256):(uint256,address,uint256,uint256,uint256,uint256,bool,uint256,address)"
  )
    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(positionId))])
    .returns([
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(orderId)), // orderId
      ethereum.Value.fromAddress(A), // owner
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(9999)), // deadline
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(100)), // createdAt
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(50)), // initialBalance
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(7)), // interest
      ethereum.Value.fromBoolean(true), // open
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(0)), // frozenTime
      ethereum.Value.fromAddress(Address.zero()), // liquidator
    ]);
  createMockedFunction(Address.fromString(CONVERTER), "isWrapper", "isWrapper(address):(bool)")
    .withArgs([ethereum.Value.fromAddress(A)]).reverts();
  createMockedFunction(
    Address.fromString(CONVERTER),
    "predictWrapperAddress",
    "predictWrapperAddress(address,bool):(address)"
  ).withArgs([ethereum.Value.fromAddress(A), ethereum.Value.fromBoolean(true)]).reverts();
  createMockedFunction(A, "symbol", "symbol():(string)").reverts();
  createMockedFunction(A, "symbol", "symbol():(bytes32)").reverts();
  createMockedFunction(A, "name", "name():(string)").reverts();
  createMockedFunction(A, "name", "name():(bytes32)").reverts();
  createMockedFunction(A, "decimals", "decimals():(uint8)").reverts();
  createMockedFunction(
    EV,
    "getPositionAssets",
    "getPositionAssets(uint256):(address[])"
  ).withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(positionId))]).reverts();
  createMockedFunction(
    EV,
    "getPositionBalances",
    "getPositionBalances(uint256):(uint256[])"
  ).withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(positionId))]).reverts();
}

describe("handlePositionOpened", () => {
  test("creates the position and debits the order balance", () => {
    clearStore();
    seedOrder();
    mockPositionOpenedCalls(234, 1);
    handlePositionOpened(
      createPositionOpenedEvent(
        BigInt.fromI32(234),          // positionId
        Address.fromString(ASSET),    // owner
        BigInt.fromI32(30),           // loanAmount
        Address.fromString(ASSET),    // baseAsset
        Address.fromString(ASSET),    // collateral
        BigInt.fromI32(10)            // collateral_amount
      )
    );
    assert.fieldEquals("Position", POSITION_ID, "loanAmount", "30");
    assert.fieldEquals("Position", POSITION_ID, "isClosed", "false");
    assert.entityCount("PositionOpenedTx", 1);
    // seedOrder starts the balance at 100; the loan of 30 must come off it
    assert.fieldEquals("Order", ORDER_ID, "balance", "70");
  });

  test("ignores the event when the parent order is unknown", () => {
    clearStore();
    mockPositionOpenedCalls(234, 55);
    handlePositionOpened(
      createPositionOpenedEvent(
        BigInt.fromI32(234),          // positionId
        Address.fromString(ASSET),    // owner
        BigInt.fromI32(30),           // loanAmount
        Address.fromString(ASSET),    // baseAsset
        Address.fromString(ASSET),    // collateral
        BigInt.fromI32(10)            // collateral_amount
      )
    );
    assert.entityCount("PositionOpenedTx", 0);
  });
});

// Full success path through exportOrder(): orders(), getCollaterals(), tokenlists(), getTokenlist()
// all return data, and the token metadata lookups fall back.
function mockExportOrderCalls(orderId: i32): void {
  const A = Address.fromString(ASSET);
  const EV = Address.fromString(TX_HASH);
  const WL = Bytes.fromHexString(
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  );

  createMockedFunction(
    EV,
    "orders",
    "orders(uint256):(address,uint256,bytes32,uint256,uint256,uint256,address,uint16,uint8,address,uint256,(uint256,address,uint32))"
  )
    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(orderId))])
    .returns([
      ethereum.Value.fromAddress(A), // owner
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(orderId)), // id
      ethereum.Value.fromFixedBytes(WL), // whitelist
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(11)), // interestRate
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(30)), // duration
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(5)), // minLoan
      ethereum.Value.fromAddress(A), // baseAsset
      ethereum.Value.fromI32(3), // currencyLimit (uint16)
      ethereum.Value.fromI32(9), // leverage (uint8)
      ethereum.Value.fromAddress(A), // oracle
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(1234)), // balance
      ethereum.Value.fromTuple(
        changetype<ethereum.Tuple>([
          ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(2)), // liquidationRewardAmount
          ethereum.Value.fromAddress(A), // liquidationRewardAsset
          ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(99999)), // deadline (uint32)
        ])
      ),
    ]);

  createMockedFunction(EV, "getCollaterals", "getCollaterals(uint256):(address[])")
    .withArgs([ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(orderId))])
    .returns([ethereum.Value.fromAddressArray([A])]);

  createMockedFunction(EV, "tokenlists", "tokenlists(bytes32):(bool,bool)")
    .withArgs([ethereum.Value.fromFixedBytes(WL)])
    .returns([ethereum.Value.fromBoolean(true), ethereum.Value.fromBoolean(false)]);

  createMockedFunction(EV, "getTokenlist", "getTokenlist(bytes32):(address[])")
    .withArgs([ethereum.Value.fromFixedBytes(WL)])
    .returns([ethereum.Value.fromAddressArray([A])]);

  createMockedFunction(Address.fromString(CONVERTER), "isWrapper", "isWrapper(address):(bool)")
    .withArgs([ethereum.Value.fromAddress(A)]).reverts();
  createMockedFunction(
    Address.fromString(CONVERTER),
    "predictWrapperAddress",
    "predictWrapperAddress(address,bool):(address)"
  ).withArgs([ethereum.Value.fromAddress(A), ethereum.Value.fromBoolean(true)]).reverts();
  createMockedFunction(A, "symbol", "symbol():(string)").reverts();
  createMockedFunction(A, "symbol", "symbol():(bytes32)").reverts();
  createMockedFunction(A, "name", "name():(string)").reverts();
  createMockedFunction(A, "name", "name():(bytes32)").reverts();
  // decimals must resolve: exportOrder() returns null when the base asset's decimals are unknown,
  // so the whole Order is dropped rather than indexed with an unformatted balance.
  createMockedFunction(A, "decimals", "decimals():(uint8)").returns([
    ethereum.Value.fromI32(18),
  ]);
}

describe("exportOrder success path", () => {
  test("handleOrderCreated writes the order and marks it alive", () => {
    clearStore();
    mockExportOrderCalls(1);
    handleOrderCreated(
      createOrderCreatedEvent(
        BigInt.fromI32(1),
        Address.fromString(ASSET),
        Address.fromString(ASSET),
        BigInt.fromI32(11),
        BigInt.fromI32(30),
        BigInt.fromI32(5),
        9
      )
    );
    assert.entityCount("Order", 1);
    assert.fieldEquals("Order", "1", "alive", "true");
    assert.fieldEquals("Order", "1", "balance", "1234");
    assert.fieldEquals("Order", "1", "interestRate", "11");
    assert.fieldEquals("Order", "1", "leverage", "9");
  });

  test("handleOrderModified refreshes the order without resurrecting a dead one", () => {
    clearStore();
    mockExportOrderCalls(1);
    // seed a closed order, then modify it
    handleOrderCreated(
      createOrderCreatedEvent(
        BigInt.fromI32(1),
        Address.fromString(ASSET),
        Address.fromString(ASSET),
        BigInt.fromI32(11),
        BigInt.fromI32(30),
        BigInt.fromI32(5),
        9
      )
    );
    handleOrderAliveStatus(createOrderAliveStatusEvent(BigInt.fromI32(1), false));
    assert.fieldEquals("Order", "1", "alive", "false");

    // the handler itself does changetype<OrderCreated>(event); both events share a signature
    handleOrderModified(
      changetype<OrderModified>(
        createOrderCreatedEvent(
          BigInt.fromI32(1),
          Address.fromString(ASSET),
          Address.fromString(ASSET),
          BigInt.fromI32(11),
          BigInt.fromI32(30),
          BigInt.fromI32(5),
          9
        )
      )
    );
    // handleOrderModified must not flip `alive` back to true
    assert.fieldEquals("Order", "1", "alive", "false");
    assert.entityCount("Order", 1);
  });
});
