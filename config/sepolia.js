/**
 * @type import('./config').NetworkConfig
 */
module.exports = {
  network: "sepolia",
  v1: {
    contracts: {
      marginModule: {
        name: "MarginModule",
        address: "0x0AC1f13111DdDae2597dfdb0e077aDb611FFFA02".toLowerCase(),
        startBlock: 12015515,
      },
      tokenConverter: {
        name: "TokenConverter",
        address: "0x5847f5C0E09182d9e75fE8B1617786F62fee0D9F".toLowerCase(),
      },
    },
  },
};
