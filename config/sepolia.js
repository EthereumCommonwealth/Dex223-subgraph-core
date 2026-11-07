/**
 * @type import('./config').NetworkConfig
 */
module.exports = {
  network: "sepolia",
  v1: {
    contracts: {
      marginModule: {
        name: "MarginModule",
        // Sepolia v6, 2026-11-07 (everything merged through Dex223-contracts #200).
        address: "0x05860334EAC4915fa678FCFa3e012d8c79641D18".toLowerCase(),
        startBlock: 12085868,
      },
      tokenConverter: {
        name: "TokenConverter",
        address: "0x5847f5C0E09182d9e75fE8B1617786F62fee0D9F".toLowerCase(),
      },
    },
  },
};
