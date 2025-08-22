/**
 * @type import('./config').NetworkConfig
 */
module.exports = {
  network: "sepolia",
  v1: {
    contracts: {
      marginModule: {
        name: "MarginModule",
        address: "0xBe20F1459981814076E859f4a8476149c0516e96".toLowerCase(),
        startBlock: 8920115,
      },
      tokenConverter: {
        name: "TokenConverter",
        address: "0x5847f5C0E09182d9e75fE8B1617786F62fee0D9F".toLowerCase(),
      },
    },
  },
};
