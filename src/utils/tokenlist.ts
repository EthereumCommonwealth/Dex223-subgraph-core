import { BigInt, Address, log, Bytes, ethereum } from "@graphprotocol/graph-ts";

import { Token, WhiteList } from "../types/schema";
import { MarginModule } from "../types/MarginModule/MarginModule";
import { fetchArrayTokens } from "../utils/token";

export function fetchToekenList(id: Bytes, marginAddress: Address): WhiteList | null {
  const contract = MarginModule.bind(marginAddress);
  // These were plain (non-try) calls: a revert aborts the mapping and stops the subgraph indexing
  // altogether, rather than skipping one event. Everything else in this codebase uses try_.
  const tokenlistCall = contract.try_tokenlists(id);
  const tokensCall = contract.try_getTokenlist(id);
  if (tokenlistCall.reverted || tokensCall.reverted) {
    log.warning("tokenlists()/getTokenlist() reverted for whitelist {}", [
      id.toHexString(),
    ]);
    return null;
  }
  const whiteListIsContract: bool = tokenlistCall.value.getIsContract(); // firs element of the array is a AutoListing
  const tokesArrayAddress: Array<Address> = tokensCall.value; // Array of tokens in the tokenlist

  let whiteList = WhiteList.load(id.toHexString());
  if (!whiteList) {
    whiteList = new WhiteList(id.toHexString());
    if (!whiteListIsContract) {
      // NOTE: this branch is the plain token-array case; the log text was the wrong way round.
      log.info("WhiteList with id {} is array tokens", [id.toHexString()]);
      const arrayTokens = fetchArrayTokens(tokesArrayAddress);
      let arrayTokensStings = new Array<string>();
      let tokesArrayAddressStings = new Array<string>();
      // наполняем их
      for (let i = 0; i < tokesArrayAddress.length; i++) {
        tokesArrayAddressStings.push(tokesArrayAddress[i].toHexString());
      }
      for (let i = 0; i < arrayTokens.length; i++) {
        arrayTokensStings.push(arrayTokens[i].id); // address
      }
      whiteList.allowedForTrading = tokesArrayAddressStings; // address[]
      whiteList.allowedForTradingTokens = arrayTokensStings; // address[]
    } else {
      log.info("WhiteList with id {} is a contract", [id.toHexString()]);
      if (tokesArrayAddress.length == 0) {
        // the autolisting address is stored as tokens[0]; an empty list would be an out-of-bounds read
        log.warning("WhiteList {} is flagged as a contract but has no tokens", [
          id.toHexString(),
        ]);
        return null;
      }
      whiteList.autoListing = tokesArrayAddress[0].toHexString(); // address
    }
    whiteList.save();
  }

  return whiteList;
}
