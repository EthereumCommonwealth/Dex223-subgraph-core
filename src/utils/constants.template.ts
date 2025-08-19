/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";
import { TokenConverter as TokenConverterContract } from "../types/MarginModule/TokenConverter";

export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
export const TOKEN_CONVERTER_ADDRESS =
  "{{ v1.contracts.tokenConverter.address }}";

export let ZERO_BI = BigInt.fromI32(0);
export let ONE_BI = BigInt.fromI32(1);
export let ZERO_BD = BigDecimal.fromString("0");
export let ONE_BD = BigDecimal.fromString("1");
export let BI_18 = BigInt.fromI32(18);

export let tokenConverterContract = TokenConverterContract.bind(
  Address.fromString(TOKEN_CONVERTER_ADDRESS)
);
