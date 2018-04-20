require("dotenv").config();

const HDWalletProvider = require("truffle-hdwallet-provider-privkey");

const privateKey = process.env.PRIVATE_KEY;

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
      provider: function() {
        return new HDWalletProvider(
          privateKey,
          "https://mainnet.infura.io/" + process.env.INFURA_TOKEN
        );
      },
      network_id: 1,
      gas: 4000000,
      gasPrice: 20e9,
    },
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(
          privateKey,
          "https://rinkeby.infura.io/" + process.env.INFURA_TOKEN
        );
      },
      network_id: 4,
      gas: 4000000, // Gas limit used for deploys
      gasPrice: 1e9
    }
  }
};
