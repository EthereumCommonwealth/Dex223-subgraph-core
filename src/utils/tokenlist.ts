import { BigInt, Address, log, Bytes, ethereum } from "@graphprotocol/graph-ts";

import { Token, WhiteList } from "../types/schema";
import { MarginModule } from "../types/MarginModule/MarginModule";
import { fetchArrayTokens } from "../utils/token";

export function fetchToekenList(id: Bytes, marginAddress: Address): WhiteList {
  const contract = MarginModule.bind(marginAddress);
  const tokeenlist = contract.tokenlists(id);
  const whiteListIsContract: bool = tokeenlist.getIsContract(); // firs element of the array is a AutoListing
  const tokesArrayAddress: Array<Address> = contract.getTokenlist(id); // Array of tokens in the tokenlist

  let whiteList = WhiteList.load(id.toHexString());
  if (!whiteList) {
    whiteList = new WhiteList(id.toHexString());
    if (!whiteListIsContract) {
      log.info("WhiteList with id {} is a contract", [id.toHexString()]);
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
      log.info("WhiteList with id {} is array tokens", [id.toHexString()]);
      whiteList.autoListing = tokesArrayAddress[0].toHexString(); // address
    }
    whiteList.save();
  }

  return whiteList;
}
