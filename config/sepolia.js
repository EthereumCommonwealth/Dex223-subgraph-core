/**
 * @type import('./config').NetworkConfig
 */
module.exports = {
  network: "sepolia",
  v1: {
    contracts: {
      marginModule: {
        name: "MarginModule",
        // Sepolia v4, 2026-10-30 (October 2026 security fixes).
        address: "0x0cc18a9557230Da8b92A73dB7A6CE0FC41abb3De".toLowerCase(),
        startBlock: 12026962,
      },
      tokenConverter: {
        name: "TokenConverter",
        address: "0x5847f5C0E09182d9e75fE8B1617786F62fee0D9F".toLowerCase(),
      },
    },
  },
};
