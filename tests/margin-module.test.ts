import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll,
} from "matchstick-as/assembly/index";
import { BigInt, Address } from "@graphprotocol/graph-ts";
import { MarginSwap } from "../dex-223-subgraph-margin-module-sepolia/generated/schema";
import { MarginSwap as MarginSwapEvent } from "../dex-223-subgraph-margin-module-sepolia/generated/MarginModule/MarginModule";
import { handleMarginSwap } from "../src/margin-module";
import { createMarginSwapEvent } from "./margin-module-utils";

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let positionId = BigInt.fromI32(234);
    let assetIn = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    let assetOut = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    );
    let amountIn = BigInt.fromI32(234);
    let amountOut = BigInt.fromI32(234);
    let newMarginSwapEvent = createMarginSwapEvent(
      positionId,
      assetIn,
      assetOut,
      amountIn,
      amountOut
    );
    handleMarginSwap(newMarginSwapEvent);
  });

  afterAll(() => {
    clearStore();
  });

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("MarginSwap created and stored", () => {
    assert.entityCount("MarginSwap", 1);

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "MarginSwap",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "positionId",
      "234"
    );
    assert.fieldEquals(
      "MarginSwap",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "assetIn",
      "0x0000000000000000000000000000000000000001"
    );
    assert.fieldEquals(
      "MarginSwap",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "assetOut",
      "0x0000000000000000000000000000000000000001"
    );
    assert.fieldEquals(
      "MarginSwap",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "amountIn",
      "234"
    );
    assert.fieldEquals(
      "MarginSwap",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "amountOut",
      "234"
    );

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  });
});
