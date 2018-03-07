// Simulate a full contribution

const MultiSigWallet = artifacts.require("MultiSigWallet");
const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const Token = artifacts.require("TokenMock");
const TokenContributionClass = artifacts.require("TokenContributionMock");
const ContributionWallet = artifacts.require("ContributionWallet");
const TeamTokensHolder = artifacts.require("TeamTokensHolderMock");
const ReserveTokensHolder = artifacts.require("ReserveTokensHolderMock");
const BountiesTokensHolder = artifacts.require("BountiesTokensHolderMock");
const AdvisorsTokensHolder = artifacts.require("AdvisorsTokensHolderMock");
const EarlyInvestorsTokensHolder = artifacts.require(
  "EarlyInvestorsTokensHolderMock"
);
const AirdropTokensHolder = artifacts.require("AirdropTokensHolderMock");
const TokenPlaceHolderClass = artifacts.require("TokenPlaceHolderMock");

const assertFail = require("./helpers/assertFail");
const BigNumber = require("bignumber.js");

contract("Contribution", function(accounts) {
  const addressToken = accounts[0];
  const addressCommunity = accounts[1];
  const addressReserve = accounts[2];
  const addressBounties = accounts[3];
  const addressTeam = accounts[4];
  const addressAirdrop = accounts[6];
  const addressAdvisors = accounts[7];
  const addressEarlyInvestors = accounts[8];
  const addressTokenHolder = accounts[9];

  const addressDummy1 = accounts[15];
  const addressDummy2 = accounts[16];

  let multisigToken;
  let multisigCommunity;
  let multisigReserve;
  let multisigBounties;
  let multisigTeam;
  let multisigAirdrop;
  let multisigAdvisors;
  let multisigEarlyInvestors;
  let miniMeTokenFactory;
  let token;
  let tokenContribution;
  let teamTokensHolder;
  let reserveTokensHolder;
  let bountiesTokensHolder;
  let airdropTokensHolder;
  let advisorsTokensHolder;
  let earlyInvestorsTokensHolder;
  let tokenPlaceHolder;

  const startBlock = 1000000;
  const endBlock = 1040000;

  const maxSupply = new BigNumber("1e9"); // 6 billions in ethers
  const percentToSale = 50; // Percentage of coins for the ico

  const totalSupplyWithoutSale = maxSupply.mul(percentToSale).div(100);

  const exchangeRate = 1;

  it("Deploys all contracts", async () => {
    multisigToken = await MultiSigWallet.new([addressToken], 1);
    multisigCommunity = await MultiSigWallet.new([addressCommunity], 1);
    multisigReserve = await MultiSigWallet.new([addressReserve], 1);
    multisigBounties = await MultiSigWallet.new([addressBounties], 1);
    multisigTeam = await MultiSigWallet.new([addressTeam], 1);
    multisigAirdrop = await MultiSigWallet.new([addressAirdrop], 1);
    multisigAdvisors = await MultiSigWallet.new([addressAdvisors], 1);
    multisigEarlyInvestors = await MultiSigWallet.new(
      [addressEarlyInvestors],
      1
    );

    miniMeTokenFactory = await MiniMeTokenFactory.new();

    token = await Token.new(miniMeTokenFactory.address);
    tokenContribution = await TokenContributionClass.new();

    teamTokensHolder = await TeamTokensHolder.new(
      multisigTeam.address,
      tokenContribution.address,
      token.address
    );

    reserveTokensHolder = await ReserveTokensHolder.new(
      multisigReserve.address,
      tokenContribution.address,
      token.address
    );

    bountiesTokensHolder = await BountiesTokensHolder.new(
      multisigBounties.address,
      tokenContribution.address,
      token.address
    );

    airdropTokensHolder = await AirdropTokensHolder.new(
      multisigAirdrop.address,
      tokenContribution.address,
      token.address
    );

    advisorsTokensHolder = await AdvisorsTokensHolder.new(
      multisigAdvisors.address,
      tokenContribution.address,
      token.address
    );

    earlyInvestorsTokensHolder = await EarlyInvestorsTokensHolder.new(
      multisigEarlyInvestors.address,
      tokenContribution.address,
      token.address
    );

    tokenPlaceHolder = await TokenPlaceHolderClass.new(
      multisigCommunity.address,
      token.address,
      tokenContribution.address
    );

    await token.changeController(tokenContribution.address);

    await tokenContribution.initialize(
      token.address,
      tokenPlaceHolder.address,

      startBlock,
      endBlock,

      reserveTokensHolder.address,
      teamTokensHolder.address,
      bountiesTokensHolder.address,
      airdropTokensHolder.address,
      advisorsTokensHolder.address,
      earlyInvestorsTokensHolder.address
    );
  });

  it("Checks initial parameters", async () => {
    assert.equal(await token.controller(), tokenContribution.address);
  });

  it("Moves time to start of the ICO, and does the first generate", async () => {
    await tokenContribution.setMockedBlockNumber(1010000);
    await token.setMockedBlockNumber(1010000);

    tokenContribution.generate(addressToken, web3.toWei(1));

    const balance = await token.balanceOf(addressToken);

    assert.equal(web3.fromWei(balance).toNumber(), exchangeRate);
  });

  it("Pauses and resumes the contribution", async () => {
    await tokenContribution.setMockedBlockNumber(1005000);
    await token.setMockedBlockNumber(1005000);
    await tokenContribution.pauseContribution();
    await assertFail(async () => {
      await token.sendTransaction({
        value: web3.toWei(5),
        gas: 300000,
        gasPrice: "20000000000"
      });
    });
    await tokenContribution.resumeContribution();
  });

  it("Check sale limit", async () => {
    await tokenContribution.setMockedBlockNumber(1010000);
    await token.setMockedBlockNumber(1010000);

    await assertFail(async () => {
      await tokenContribution.generate(
        addressToken,
        web3.toWei(tokenContribution.tokensIssued())
      );
    });
  });

  it("Finalizes", async () => {
    const tokensIssuedPreFinalize = await tokenContribution.tokensIssued();

    await tokenContribution.setMockedBlockNumber(endBlock + 1);
    await tokenContribution.finalize();

    const currentSupply = totalSupplyWithoutSale.add(
      web3.fromWei(tokensIssuedPreFinalize)
    );

    const tokensIssued = await tokenContribution.tokensIssued();

    assert.equal(
      tokensIssued.toNumber(),
      web3.toWei(currentSupply).toNumber(),
      "total supply"
    );

    const balanceTeam = await token.balanceOf(teamTokensHolder.address);
    assert.equal(
      balanceTeam.toNumber(),
      web3
        .toWei(maxSupply)
        .mul(0.18)
        .toNumber(),
      "team"
    );

    const balanceReserve = await token.balanceOf(reserveTokensHolder.address);
    assert.equal(
      balanceReserve.toNumber(),
      web3
        .toWei(maxSupply)
        .mul(0.08)
        .toNumber(),
      "reserve"
    );

    const balanceBounties = await token.balanceOf(bountiesTokensHolder.address);
    assert.equal(
      balanceBounties.toNumber(),
      web3
        .toWei(maxSupply)
        .mul(0.13)
        .toNumber(),
      "bounties"
    );

    const balanceAirdrop = await token.balanceOf(airdropTokensHolder.address);
    assert.equal(
      balanceAirdrop.toNumber(),
      web3
        .toWei(maxSupply)
        .mul(0.02)
        .toNumber(),
      "airdrop"
    );

    const balanceAdvisors = await token.balanceOf(advisorsTokensHolder.address);
    assert.equal(
      balanceAdvisors.toNumber(),
      web3
        .toWei(maxSupply)
        .mul(0.07)
        .toNumber(),
      "advisors"
    );

    const balanceEarlyInvestors = await token.balanceOf(
      earlyInvestorsTokensHolder.address
    );
    assert.equal(
      balanceEarlyInvestors.toNumber(),
      web3
        .toWei(maxSupply)
        .mul(0.02)
        .toNumber(),
      "early investors"
    );
  });

  it("Doesn't allow transfers in the 1 week period", async () => {
    await assertFail(async () => {
      await token.transfer(addressTokenHolder, web3.toWei(1));
    });
  });

  it("Allows transfers after 1 week period", async () => {
    const t = Math.floor(new Date().getTime() / 1000) + 86400 * 7 + 1000;
    await tokenPlaceHolder.setMockedTime(t);

    await token.transfer(addressDummy1, web3.toWei(1));

    const balance2 = await token.balanceOf(addressDummy1);

    assert.equal(web3.fromWei(balance2).toNumber(), 1);
  });

  it("Checks that Token's Controller is upgradeable", async () => {
    await multisigCommunity.submitTransaction(
      tokenPlaceHolder.address,
      0,
      tokenPlaceHolder.contract.changeController.getData(accounts[9]),
      { from: addressCommunity }
    );

    const controller = await token.controller();

    assert.equal(controller, accounts[9]);
  });
});
