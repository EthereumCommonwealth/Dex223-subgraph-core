/**
 * @type import('./config').NetworkConfig
 */
module.exports = {
  network: "mainnet",
  v1: {
    contracts: {
      marginModule: {
        name: "MarginModule",
        // Mainnet v2, 2026-10-07: bound to factory 0x8990...C3a5 and locked to oracle 0xA86B...Dc83
        // (Dex223-contracts #103).
        address: "0xd48A17133900495863e93EDD4B2F3eA6015F55e4".toLowerCase(),
        startBlock: 26140901,
      },
      tokenConverter: {
        name: "TokenConverter",
        // The live ERC-7417 converter every mainnet wrapper belongs to.
        address: "0xe7E969012557f25bECddB717A3aa2f4789ba9f9a".toLowerCase(),
      },
    },
  },
};
