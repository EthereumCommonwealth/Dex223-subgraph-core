/**
 * @type import('./config').NetworkConfig
 */
module.exports = {
  network: "sepolia",
  v1: {
    contracts: {
      marginModule: {
        name: "MarginModule",
        address: "0x12534E762D2224dc6e7DB3827924E59d0Fa50dcE".toLowerCase(),
        startBlock: 11779706,
      },
      tokenConverter: {
        name: "TokenConverter",
        address: "0x5847f5C0E09182d9e75fE8B1617786F62fee0D9F".toLowerCase(),
      },
    },
  },
};
