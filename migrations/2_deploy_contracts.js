const MultiSigWallet = artifacts.require("MultiSigWallet");
const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const Token = artifacts.require("Token");
const TokenContribution = artifacts.require("TokenContribution");
const ContributionWallet = artifacts.require("ContributionWallet");
const TeamTokensHolder = artifacts.require("TeamTokensHolder");
const BountiesTokensHolder = artifacts.require("BountiesTokensHolder");
const AdvisorsTokensHolder = artifacts.require("AdvisorsTokensHolder");
const AirdropTokensHolder = artifacts.require("AirdropTokensHolder");
const EarlyInvestorsTokensHolder = artifacts.require(
  "EarlyInvestorsTokensHolder"
);
const ReserveTokensHolder = artifacts.require("ReserveTokensHolder");
const TokenPlaceHolder = artifacts.require("TokenPlaceHolder");

// All of these constants need to be configured before deploy
const addressMainOwner = "0x00349679446e6bfb3232eAfe69e4157FFf98cace";

const addressesReserve = [addressMainOwner];
const multisigReserveReqs = 1;

const addressesTeam = [addressMainOwner];
const multisigTeamReqs = 1;

const addressesBounties = [addressMainOwner];
const multisigBountiesReqs = 1;

const addressesAirdrop = [addressMainOwner];
const multisigAirdropReqs = 1;

const addressesAdvisors = [addressMainOwner];
const multisigAdvisorsReqs = 1;

const addressesEarlyInvestors = [addressMainOwner];
const multisigEarlyInvestorsReqs = 1;

const startBlock = 1941920;
const endBlock = 1942000;

module.exports = async function(deployer, network, accounts) {
  //if (network === "development") return;  // Don't deploy on tests
  console.log("Start migrating: ");
  // MultiSigWallet send
  let multisigReserveFuture = MultiSigWallet.new(
    addressesReserve,
    multisigReserveReqs
  );

  let multisigTeamFuture = MultiSigWallet.new(addressesTeam, multisigTeamReqs);

  let multisigBountiesFuture = MultiSigWallet.new(
    addressesBounties,
    multisigBountiesReqs
  );

  let multisigAirdropFuture = MultiSigWallet.new(
    addressesAirdrop,
    multisigAirdropReqs
  );

  let multisigAdvisorsFuture = MultiSigWallet.new(
    addressesAdvisors,
    multisigAdvisorsReqs
  );

  let multisigEarlyInvestorsFuture = MultiSigWallet.new(
    addressesEarlyInvestors,
    multisigEarlyInvestorsReqs
  );

  // MiniMeTokenFactory send
  let miniMeTokenFactoryFuture = MiniMeTokenFactory.new();

  // MultiSigWallet wait
  let multisigReserve = await multisigReserveFuture;
  console.log("MultiSigWallet Reserve: " + multisigReserve.address + "\n");

  let multisigTeam = await multisigTeamFuture;
  console.log("MultiSigWallet Team: " + multisigTeam.address + "\n");

  let multisigBounties = await multisigBountiesFuture;
  console.log("MultiSigWallet Bounties: " + multisigBounties.address + "\n");

  let multisigAirdrop = await multisigAirdropFuture;
  console.log("MultiSigWallet Airdrop: " + multisigAirdrop.address + "\n");

  let multisigAdvisors = await multisigAdvisorsFuture;
  console.log("MultiSigWallet Advisors: " + multisigAdvisors.address + "\n");

  let multisigEarlyInvestors = await multisigEarlyInvestorsFuture;
  console.log(
    "MultiSigWallet Early Investors: " + multisigEarlyInvestors.address + "\n"
  );

  // MiniMeTokenFactory wait
  let miniMeTokenFactory = await miniMeTokenFactoryFuture;
  console.log("MiniMeTokenFactory: " + miniMeTokenFactory.address + "\n");

  let tokenFuture = Token.new(miniMeTokenFactory.address);

  let tokenCrowdsaleFuture = TokenContribution.new();

  // Token wait
  let token = await tokenFuture;
  console.log("Token: " + token.address);
  // StatusContribution wait
  let tokenContribution = await tokenCrowdsaleFuture;
  console.log("Token contribution: " + tokenContribution.address + "\n");

  // Token initialize checkpoints for 0th TX gas savings
  await token.generateTokens("0x0", 1);
  await token.destroyTokens("0x0", 1);

  // Change controller
  await token.changeController(tokenContribution.address);

  // TeamTokensHolder send
  let teamTokensHolderFuture = TeamTokensHolder.new(
    multisigTeam.address,
    tokenContribution.address
  );

  // ReserveTokensHolder send
  let reserveTokensHolderFuture = ReserveTokensHolder.new(
    multisigReserve.address,
    tokenContribution.address
  );

  // BountiesTokensHolder send
  let bountiesTokensHolderFuture = BountiesTokensHolder.new(
    multisigBounties.address,
    tokenContribution.address
  );

  // AirdropTokensHolder send
  let airdropTokensHolderFuture = AirdropTokensHolder.new(
    multisigAirdrop.address,
    tokenContribution.address
  );

  // EarlyInvestorsTokensHolder send
  let advisorsTokensHolderFuture = AdvisorsTokensHolder.new(
    multisigAdvisors.address,
    tokenContribution.address
  );

  // AdvisorsTokensHolder send
  let earlyInvestorsTokensHolderFuture = EarlyInvestorsTokensHolder.new(
    multisigEarlyInvestors.address,
    tokenContribution.address
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
  console.log("EarlyInvestorsTokensHolder: " + earlyInvestorsTokensHolder.address + "\n");

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
    placeHolder.address,

    startBlock,
    endBlock,

    reserveTokensHolder.address,
    teamTokensHolder.address,
    bountiesTokensHolder.address,
    airdropTokensHolder.address,
    advisorsTokensHolder.address,
    earlyInvestorsTokensHolder.address
  );

  console.log("Token crowdsale initialized! \n");
};
