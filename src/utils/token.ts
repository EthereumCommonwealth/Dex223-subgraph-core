/* eslint-disable prefer-const */
import { ERC20andERC223 } from "../types/MarginModule/ERC20andERC223";
import { ERC20andERC223SymbolBytes } from "../types/MarginModule/ERC20andERC223SymbolBytes";
import { ERC20andERC223NameBytes } from "../types/MarginModule/ERC20andERC223NameBytes";
import { Token } from "../types/schema";
// import { BigInt, Address, log } from "@graphprotocol/graph-ts";

import {
  getStaticDefinition,
  STATIC_TOKEN_DEFINITIONS,
  StaticTokenDefinition,
} from "./staticTokenDefinition";
import { BigInt, Address, log, BigDecimal } from "@graphprotocol/graph-ts";
import { tokenConverterContract, ADDRESS_ZERO } from "./constants";
// import { TokenConverter } from "../types/MarginModule/TokenConverter";
// import { log } from "matchstick-as";

export class TokenAddresses {
  addressERC20: Address;
  addressERC223: Address;

  constructor(a: Address, b: Address) {
    this.addressERC20 = a;
    this.addressERC223 = b;
  }
}

export function isNullEthValue(value: string): boolean {
  return (
    value ==
    "0x0000000000000000000000000000000000000000000000000000000000000001"
  );
}

export function getTokenId(
  tokenAddressERC20: Address,
  tokenAddressERC223: Address
): string {
  return `${tokenAddressERC20.toHexString()}-${tokenAddressERC223.toHexString()}`;
}

export function getTokenListedId(
  tokenAddressERC20: Address,
  tokenAddressERC223: Address,
  listedBy: Address
): string {
  return `${getTokenId(
    tokenAddressERC20,
    tokenAddressERC223
  )}-${listedBy.toHexString()}`;
}

export function fetchTokenSymbolSlim(
  tokenAddress: Address,
  staticTokenDefinitions: StaticTokenDefinition[] = STATIC_TOKEN_DEFINITIONS
): string {
  const contract = ERC20andERC223.bind(tokenAddress);
  const contractSymbolBytes = ERC20andERC223SymbolBytes.bind(tokenAddress);

  // try types string and bytes32 for symbol
  let symbolValue = "unknown";
  const symbolResult = contract.try_symbol();
  if (symbolResult.reverted) {
    const symbolResultBytes = contractSymbolBytes.try_symbol();
    if (!symbolResultBytes.reverted) {
      // for broken pairs that have no symbol function exposed
      if (!isNullEthValue(symbolResultBytes.value.toHexString())) {
        symbolValue = symbolResultBytes.value.toString();
      } else {
        // try with the static definition
        const staticTokenDefinition = getStaticDefinition(
          tokenAddress,
          staticTokenDefinitions
        );
        if (staticTokenDefinition != null) {
          symbolValue = staticTokenDefinition.symbol;
        }
      }
    }
  } else {
    symbolValue = symbolResult.value;
  }

  return symbolValue;
}

export function fetchTokenNameSlim(
  tokenAddress: Address,
  staticTokenDefinitions: StaticTokenDefinition[] = STATIC_TOKEN_DEFINITIONS
): string {
  const contract = ERC20andERC223.bind(tokenAddress);
  const contractNameBytes = ERC20andERC223NameBytes.bind(tokenAddress);

  // try types string and bytes32 for name
  let nameValue = "unknown";
  const nameResult = contract.try_name();
  if (nameResult.reverted) {
    const nameResultBytes = contractNameBytes.try_name();
    if (!nameResultBytes.reverted) {
      // for broken exchanges that have no name function exposed
      if (!isNullEthValue(nameResultBytes.value.toHexString())) {
        nameValue = nameResultBytes.value.toString();
      } else {
        // try with the static definition
        const staticTokenDefinition = getStaticDefinition(
          tokenAddress,
          staticTokenDefinitions
        );
        if (staticTokenDefinition != null) {
          nameValue = staticTokenDefinition.name;
        }
      }
    }
  } else {
    nameValue = nameResult.value;
  }

  return nameValue;
}

export function fetchTokenDecimalsSlim(
  tokenAddress: Address,
  staticTokenDefinitions: StaticTokenDefinition[] = STATIC_TOKEN_DEFINITIONS
): BigInt | null {
  const contract = ERC20andERC223.bind(tokenAddress);
  // try types uint8 for decimals
  const decimalResult = contract.try_decimals();

  if (!decimalResult.reverted) {
    const raw = decimalResult.value; // raw: i32
    const decimals = BigInt.fromI32(raw); // convert to BigInt
    if (decimals.lt(BigInt.fromI32(255))) {
      return decimals; // return BigInt, not i32
    }
  } else {
    // try with the static definition
    const staticTokenDefinition = getStaticDefinition(
      tokenAddress,
      staticTokenDefinitions
    );
    if (staticTokenDefinition) {
      return staticTokenDefinition.decimals;
    }
  }

  return null;
}

export function fetchTokenSymbol(
  tokenAddressERC20: Address,
  tokenAddressERC223: Address
): string {
  let value = fetchTokenSymbolSlim(tokenAddressERC20);
  if (value == "unknown") {
    return fetchTokenSymbolSlim(tokenAddressERC223);
  }
  return value;
}

export function fetchTokenName(
  tokenAddressERC20: Address,
  tokenAddressERC223: Address
): string {
  let value = fetchTokenNameSlim(tokenAddressERC20);
  if (value == "unknown") {
    return fetchTokenNameSlim(tokenAddressERC223);
  }
  return value;
}

export function fetchTokenDecimals(
  tokenAddressERC20: Address,
  tokenAddressERC223: Address,
  staticTokenDefinitions: StaticTokenDefinition[] = STATIC_TOKEN_DEFINITIONS
): BigInt | null {
  const value = fetchTokenDecimalsSlim(
    tokenAddressERC20,
    staticTokenDefinitions
  );
  if (value === null) {
    return fetchTokenDecimalsSlim(tokenAddressERC223, staticTokenDefinitions);
  }
  return value;
}

export function fetchTokenInConverter(address: Address): boolean {
  // Try getting ERC223 wrapper
  let resultERC223 = tokenConverterContract.try_getERC223WrapperFor(address);
  if (!resultERC223.reverted) {
    return resultERC223.value.toHexString() != ADDRESS_ZERO;
  }

  // Try getting ERC20 wrapper
  let resultERC20 = tokenConverterContract.try_getERC20WrapperFor(address);
  if (!resultERC20.reverted) {
    return resultERC20.value.toHexString() != ADDRESS_ZERO;
  }

  return false;
}

export function getStandard(address: Address): BigInt | null {
  const contract = ERC20andERC223.bind(address);
  // try types uint8 for decimals
  const standard = contract.try_standard();
  if (!standard.reverted) {
    return standard.value;
  }
  return null;
}

export function getPredictAddress(address: Address, isERC20: boolean): Address {
  const predict = tokenConverterContract.try_predictWrapperAddress(
    address,
    isERC20
  );
  return predict.value; // If prediction fails, return original address
}

export function getIsWrapped(address: Address): boolean {
  const isWrapper = tokenConverterContract.try_isWrapper(address);
  if (!isWrapper.reverted) {
    return isWrapper.value;
  }
  return false;
}

export function fetchTokenAddress(address: Address): TokenAddresses {
  // 1) Try to determine if the address is a wrapper
  const isWrapperCall = getIsWrapped(address);
  if (isWrapperCall) {
    // This is a wrapper
    const token = ERC20andERC223.bind(address);

    // Determine the standard (223 or not)
    const standardCall = token.try_standard();
    if (
      !standardCall.reverted &&
      standardCall.value.equals(BigInt.fromI32(223))
    ) {
      // ERC-223 wrapper → return origin ERC20
      const originCall = tokenConverterContract.try_getERC20OriginFor(address);
      if (!originCall.reverted) {
        return new TokenAddresses(originCall.value, address);
      }
    } else {
      // ERC-20 wrapper → return origin ERC223
      const originCall = tokenConverterContract.try_getERC223OriginFor(address);
      if (!originCall.reverted) {
        return new TokenAddresses(address, originCall.value);
      }
    }
  }

  // 2) If not a wrapper or got revert above — predict wrapper
  const predictCall = getPredictAddress(address, true);
  // 3) Fallback: return original in both fields
  return new TokenAddresses(address, predictCall);
}

export function fetchToken(
  addressERC20: Address,
  addressERC223: Address
): Token {
  const tokenId = getTokenId(addressERC20, addressERC223);
  let token = Token.load(tokenId);
  if (!token) {
    token = new Token(tokenId);
    token.addressERC20 = addressERC20.toHexString();
    token.addressERC223 = addressERC223.toHexString();
    token.symbol = fetchTokenSymbol(addressERC20, addressERC223);
    token.name = fetchTokenName(addressERC20, addressERC223);
    token.decimals = fetchTokenDecimals(addressERC20, addressERC223);
    token.save();
  }
  return token;
}

export function fetchArrayTokens(arrayAddress: Array<Address>): Array<Token> {
  let seenAddresses = new Array<string>();
  let result = new Array<Token>();
  for (let i = 0; i < arrayAddress.length; i++) {
    let addr = arrayAddress[i];

    // If this raw address or has already been included in any pair — skip
    if (seenAddresses.includes(addr.toHexString())) {
      continue;
    }

    // Get ERC20/ERC223 pair
    let pair = fetchTokenAddress(addr);
    log.debug("Pair: {}, {}", [
      pair.addressERC20.toHexString(),
      pair.addressERC223.toHexString(),
    ]);
    let erc20 = pair.addressERC20;
    let erc223 = pair.addressERC223;

    // Create or get existing Token
    let token = fetchToken(erc20, erc223);
    if (token.decimals === null) {
      continue; // If token creation failed, skip
    }
    // Record its ID once
    result.push(token);

    // Mark both addresses as "processed"
    seenAddresses.push(erc20.toHexString());
    seenAddresses.push(erc223.toHexString());
  }
  return result;
}

export function toFormatValue(
  value: BigInt,
  decimals: BigInt | null = null
): BigDecimal {
  if (decimals === null) {
    return value.toBigDecimal();
  }
  let decimalsInt: u8 = decimals.toI32() as u8;
  // Convert BigInt to BigDecimal and divide by 10^decimals
  let factor = BigInt.fromI32(10).pow(decimalsInt);
  return value.toBigDecimal().div(factor.toBigDecimal());
}
