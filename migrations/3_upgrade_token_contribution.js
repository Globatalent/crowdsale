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
const addressToken = "0xD8Bd3958725F216Eb236E9DC65B169DE48101C6A";

const addressesReserve = addressMainOwner;

const addressesTeam = addressMainOwner;

const addressesBounties = addressMainOwner;

const addressesAirdrop = addressMainOwner;

const addressesAdvisors = addressMainOwner;

const addressesEarlyInvestors = addressMainOwner;

module.exports = function(deployer, network, accounts) {
  //if (network === "development") return;  // Don't deploy on tests
  console.log("Start migrating: ");

  return deployer
    .deploy(TokenContribution)
    .then(() => {
      return deployer.deploy(
        TeamTokensHolder,
        addressMainOwner,
        TokenContribution.address,
        addressToken
      );
    })
    .then(() => {
      return deployer.deploy(
        ReserveTokensHolder,
        addressMainOwner,
        TokenContribution.address,
        addressToken
      );
    })
    .then(() => {
      return deployer.deploy(
        BountiesTokensHolder,
        addressMainOwner,
        TokenContribution.address,
        addressToken
      );
    })
    .then(() => {
      return deployer.deploy(
        AirdropTokensHolder,
        addressMainOwner,
        TokenContribution.address,
        addressToken
      );
    })
    .then(() => {
      return deployer.deploy(
        AdvisorsTokensHolder,
        addressMainOwner,
        TokenContribution.address,
        addressToken
      );
    })
    .then(() => {
      return deployer.deploy(
        EarlyInvestorsTokensHolder,
        addressMainOwner,
        TokenContribution.address,
        addressToken
      );
    })
    .catch(err => {
      console.log(err);
    });
};
