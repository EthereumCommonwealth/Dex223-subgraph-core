/**
 * @type import('./config').NetworkConfig
 */
module.exports = {
  network: "mainnet",
  v1: {
    contracts: {
      marginModule: {
        name: "MarginModule",
        // Mainnet v2, redeployed 2026-10-10 with the oracle precision fix: bound to factory
        // 0x8990...C3a5 and locked to oracle 0xd6bB...2e72. Replaces 0xd48A...55e4 (no orders).
        address: "0x93559d9E48144045a774FCF69B46F9ab10EEC831".toLowerCase(),
        startBlock: 26294579,
      },
      tokenConverter: {
        name: "TokenConverter",
        // The live ERC-7417 converter every mainnet wrapper belongs to.
        address: "0xe7E969012557f25bECddB717A3aa2f4789ba9f9a".toLowerCase(),
      },
    },
  },
};
