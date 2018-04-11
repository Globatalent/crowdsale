const HDWalletProvider = require("truffle-hdwallet-provider");

const mnemonic =
  process.env.TEST_MNEMONIC ||
  "token mnemonic token mnemonic token mnemonic token mnemonic token mnemonic token mnemonic";
const providerRopsten = new HDWalletProvider(
  mnemonic,
  "https://ropsten.infura.io/",
  0
);
const providerKovan = new HDWalletProvider(
  mnemonic,
  "https://kovan.infura.io",
  0
);

module.exports = {
  networks: {
    development: {
      network_id: 15,
      host: "localhost",
      port: 8545,
      gas: 4000000,
      gasPrice: 20e9
    },
    development_migrate: {
      network_id: "*",
      host: "localhost",
      port: 8545,
      gas: 4000000,
      gasPrice: 20e9,
      from: "0xf93df8c288b9020e76583a6997362e89e0599e99"
    },
    mainnet: {
      network_id: 1,
      host: "localhost",
      port: 8545,
      gas: 4000000,
      gasPrice: 20e9,
      from: "0xE07c39C7aC020047535020579f01E510321FCD4A"
    },
    ropsten: {
      network_id: 3,
      provider: providerRopsten,
      gas: 4000000,
      gasPrice: 20e9
    },
    kovan: {
      network_id: 42,
      provider: providerKovan,
      gas: 4000000,
      gasPrice: 20e9
    },
    rinkeby: {
      host: "localhost", // Connect to geth on the specified
      port: 8545,
      from: "0xCd21BC4dfD3566285496A53511bD6A8F0928e9AD", // default address to use for any transaction Truffle makes during migrations
      network_id: 4,
      gas: 4000000, // Gas limit used for deploys
      gasPrice: 1e9
    }
  }
};
