const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const Token = artifacts.require("Token");
const TokenContribution = artifacts.require("TokenContribution");
const TeamTokensHolder = artifacts.require("TeamTokensHolder");
const BountiesTokensHolder = artifacts.require("BountiesTokensHolder");
const AdvisorsTokensHolder = artifacts.require("AdvisorsTokensHolder");
const AirdropTokensHolder = artifacts.require("AirdropTokensHolder");
const EarlyInvestorsTokensHolder = artifacts.require(
  "EarlyInvestorsTokensHolder"
);
const ReserveTokensHolder = artifacts.require("ReserveTokensHolder");

// All of these constants need to be configured before deploy
const addressMainOwner = "0xE07c39C7aC020047535020579f01E510321FCD4A";

const addressesReserve = addressMainOwner;

const addressesTeam = addressMainOwner;

const addressesBounties = addressMainOwner;

const addressesAirdrop = addressMainOwner;

const addressesAdvisors = addressMainOwner;

const addressesEarlyInvestors = addressMainOwner;

module.exports = function(deployer, network, accounts) {
  //if (network === "development") return;  // Don't deploy on tests
  console.log("Start migrating: ");

  // MiniMeTokenFactory send
  return deployer
    .deploy(MiniMeTokenFactory)
    .then(() => {
      return deployer
        .deploy(Token, MiniMeTokenFactory.address)
        .then(() => {
          return deployer.deploy(TokenContribution);
        })
        .then(() => {
          return Token.deployed();
        })
        .then(tokenInstance => {
          return tokenInstance.generateTokens("0x0", 1).then(() => {
            return tokenInstance.destroyTokens("0x0", 1).then(() => {
              return tokenInstance.changeController(TokenContribution.address);
            });
          });
        })
        .then(() => {
          return deployer.deploy(
            TeamTokensHolder,
            addressMainOwner,
            TokenContribution.address,
            Token.address
          );
        })
        .then(() => {
          return deployer.deploy(
            ReserveTokensHolder,
            addressMainOwner,
            TokenContribution.address,
            Token.address
          );
        })
        .then(() => {
          return deployer.deploy(
            BountiesTokensHolder,
            addressMainOwner,
            TokenContribution.address,
            Token.address
          );
        })
        .then(() => {
          return deployer.deploy(
            AirdropTokensHolder,
            addressMainOwner,
            TokenContribution.address,
            Token.address
          );
        })
        .then(() => {
          return deployer.deploy(
            AdvisorsTokensHolder,
            addressMainOwner,
            TokenContribution.address,
            Token.address
          );
        })
        .then(() => {
          return deployer.deploy(
            EarlyInvestorsTokensHolder,
            addressMainOwner,
            TokenContribution.address,
            Token.address
          );
        })
        .then(() => {
          return TokenContribution.deployed();
        })
        .then(tokenContributionInstance => {
          return tokenContributionInstance.initialize(
            Token.address,

            ReserveTokensHolder.address,
            TeamTokensHolder.address,
            BountiesTokensHolder.address,
            AirdropTokensHolder.address,
            AdvisorsTokensHolder.address,
            EarlyInvestorsTokensHolder.address
          );
        });
    })
    .catch(err => {
      console.log(err);
    });
};
