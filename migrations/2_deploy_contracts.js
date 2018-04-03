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
const TokenPlaceHolder = artifacts.require("TokenPlaceHolderMock");

// All of these constants need to be configured before deploy
const addressMainOwner = "0xE07c39C7aC020047535020579f01E510321FCD4A";

const addressesReserve = addressMainOwner;

const addressesTeam = addressMainOwner;

const addressesBounties = addressMainOwner;

const addressesAirdrop = addressMainOwner;

const addressesAdvisors = addressMainOwner;

const addressesEarlyInvestors = addressMainOwner;

module.exports = async function(deployer, network, accounts) {
  //if (network === "development") return;  // Don't deploy on tests
  console.log("Start migrating: ");

  // MiniMeTokenFactory send
  let miniMeTokenFactoryFuture = MiniMeTokenFactory.new();

  // MiniMeTokenFactory wait
  let miniMeTokenFactory = await miniMeTokenFactoryFuture;
  console.log("MiniMeTokenFactory: " + miniMeTokenFactory.address + "\n");

  let tokenFuture = Token.new(miniMeTokenFactory.address);

  let tokenCrowdsaleFuture = TokenContribution.new();

  // Token wait
  let token = await tokenFuture;
  console.log("Token: " + token.address);

  // Contribution wait
  let tokenContribution = await tokenCrowdsaleFuture;
  console.log("Token contribution: " + tokenContribution.address + "\n");

  // Token initialize checkpoints for 0th TX gas savings
  await token.generateTokens("0x0", 1);
  await token.destroyTokens("0x0", 1);

  // Change controller
  await token.changeController(tokenContribution.address);

  // TeamTokensHolder send
  let teamTokensHolderFuture = TeamTokensHolder.new(
    addressMainOwner,
    tokenContribution.address,
    token.address
  );

  // ReserveTokensHolder send
  let reserveTokensHolderFuture = ReserveTokensHolder.new(
    addressMainOwner,
    tokenContribution.address,
    token.address
  );

  // BountiesTokensHolder send
  let bountiesTokensHolderFuture = BountiesTokensHolder.new(
    addressMainOwner,
    tokenContribution.address,
    token.address
  );

  // AirdropTokensHolder send
  let airdropTokensHolderFuture = AirdropTokensHolder.new(
    addressMainOwner,
    tokenContribution.address,
    token.address
  );

  // EarlyInvestorsTokensHolder send
  let advisorsTokensHolderFuture = AdvisorsTokensHolder.new(
    addressMainOwner,
    tokenContribution.address,
    token.address
  );

  // AdvisorsTokensHolder send
  let earlyInvestorsTokensHolderFuture = EarlyInvestorsTokensHolder.new(
    addressMainOwner,
    tokenContribution.address,
    token.address
  );

  // Waits and logs
  let teamTokensHolder = await teamTokensHolderFuture;
  console.log("TeamTokensHolder: " + teamTokensHolder.address + "\n");

  let reserveTokensHolder = await reserveTokensHolderFuture;
  console.log("ReserveTokensHolder: " + reserveTokensHolder.address + "\n");

  let bountiesTokensHolder = await bountiesTokensHolderFuture;
  console.log("BountiesTokensHolder: " + bountiesTokensHolder.address + "\n");

  let airdropTokensHolder = await airdropTokensHolderFuture;
  console.log("AirdropTokensHolder: " + airdropTokensHolder.address + "\n");

  let advisorsTokensHolder = await advisorsTokensHolderFuture;
  console.log("AdvisorsTokensHolder: " + advisorsTokensHolder.address + "\n");

  let earlyInvestorsTokensHolder = await earlyInvestorsTokensHolderFuture;
  console.log(
    "EarlyInvestorsTokensHolder: " + earlyInvestorsTokensHolder.address + "\n"
  );

  // TokenPlaceHolder send
  let tokenPlaceHolderFuture = TokenPlaceHolder.new(
    addressMainOwner,
    token.address,
    tokenContribution.address
  );

  // Token placeholder wait
  let placeHolder = await tokenPlaceHolderFuture;
  console.log("Token placeholder: " + placeHolder.address + "\n");

  // Token Contribution initialize send/wait
  await tokenContribution.initialize(
    token.address,

    reserveTokensHolder.address,
    teamTokensHolder.address,
    bountiesTokensHolder.address,
    airdropTokensHolder.address,
    advisorsTokensHolder.address,
    earlyInvestorsTokensHolder.address
  );

  console.log("Token crowdsale initialized! \n");
};
