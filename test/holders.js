// Simulate a full contribution

const MultiSigWallet = artifacts.require("MultiSigWallet");
const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const Token = artifacts.require("TokenMock");
const TokenContributionClass = artifacts.require("TokenContributionMock");
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

contract("Holders", function(accounts) {
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

  it("Finalizes", async () => {
    await token.setMockedBlockNumber(1010000);

    await tokenContribution.setMockedBlockNumber(endBlock + 1);
    await tokenContribution.finalize();

    // Allow transfers
    const t = Math.floor(new Date().getTime() / 1000) + 86400 * 7 + 1000;
    await tokenPlaceHolder.setMockedTime(t);
  });

  it("Disallows team from transfering before 12 months have past", async () => {
    // This function will fail in the multisig
    await multisigTeam.submitTransaction(
      teamTokensHolder.address,
      0,
      teamTokensHolder.contract.collectTokens.getData(),
      { from: addressTeam, gas: 1000000 }
    );

    const balance = await token.balanceOf(multisigTeam.address);
    assert.equal(balance, 0);
  });

  it("Allows team to extract 40% after 12 months", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 361;
    await teamTokensHolder.setMockedTime(t);

    await multisigTeam.submitTransaction(
      teamTokensHolder.address,
      0,
      teamTokensHolder.contract.collectTokens.getData(),
      { from: addressTeam }
    );

    const balance = await token.balanceOf(multisigTeam.address);

    const calcTokens = maxSupply
      .mul(0.18)
      .mul(0.4)
      .toNumber();
    const realTokens = web3.fromWei(balance).toNumber();

    // Check that tokens exists
    assert(calcTokens > 0);
    assert(realTokens > 0, "No tokens transferred on claim");

    assert.equal(realTokens, calcTokens);
  });

  it("Allows team to extract 80% after 24 months", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 721;
    await teamTokensHolder.setMockedTime(t);

    await multisigTeam.submitTransaction(
      teamTokensHolder.address,
      0,
      teamTokensHolder.contract.collectTokens.getData(),
      { from: addressTeam }
    );

    const balance = await token.balanceOf(multisigTeam.address);

    const calcTokens = maxSupply
      .mul(0.18)
      .mul(0.8)
      .toNumber();
    const realTokens = web3.fromWei(balance).toNumber();

    // Check that tokens exists
    assert(calcTokens > 0);
    assert(realTokens > 0, "No tokens transferred on claim");

    assert.equal(realTokens, calcTokens);
  });

  it("Allows team to extract everything after 36 months", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 1080 + 1; // 1 second after 36 months
    await teamTokensHolder.setMockedTime(t);

    await multisigTeam.submitTransaction(
      teamTokensHolder.address,
      0,
      teamTokensHolder.contract.collectTokens.getData(),
      { from: addressTeam }
    );

    const balance = await token.balanceOf(multisigTeam.address);

    const calcTokens = maxSupply
      .mul(0.18)
      .mul(1)
      .toNumber();
    const realTokens = web3.fromWei(balance).toNumber();

    // Check that tokens tokens exists
    assert(calcTokens > 0);
    assert(realTokens > 0, "No tokens transferred on claim");

    assert.equal(realTokens, calcTokens);
  });

  it("Disallows transfering from reserve before 18 months have past", async () => {
    const t = Math.floor(new Date().getTime() / 1000) + 86400 * 539;
    await reserveTokensHolder.setMockedTime(t);

    // This function will fail in the multisig
    await multisigReserve.submitTransaction(
      reserveTokensHolder.address,
      0,
      reserveTokensHolder.contract.collectTokens.getData(),
      { from: addressReserve, gas: 1000000 }
    );

    const balance = await token.balanceOf(multisigReserve.address);
    assert.equal(balance, 0);
  });

  it("Allows to extract 50% from reserve after 18 months", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 541;
    await reserveTokensHolder.setMockedTime(t);

    await multisigReserve.submitTransaction(
      reserveTokensHolder.address,
      0,
      reserveTokensHolder.contract.collectTokens.getData(),
      { from: addressReserve }
    );

    const balance = await token.balanceOf(multisigReserve.address);

    const calcTokens = maxSupply
      .mul(0.08)
      .mul(0.5)
      .toNumber();
    const realTokens = web3.fromWei(balance).toNumber();

    // Check that tokens exists
    assert(calcTokens > 0);
    assert(realTokens > 0, "No tokens transferred on claim");

    assert.equal(realTokens, calcTokens);
  });

  it("Disallow to extract from reserve again", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 542;
    await reserveTokensHolder.setMockedTime(t);

    const preBalance = await token.balanceOf(multisigReserve.address);
    const postRealTokens = web3.fromWei(preBalance).toNumber();

    await multisigReserve.submitTransaction(
      reserveTokensHolder.address,
      0,
      reserveTokensHolder.contract.collectTokens.getData(),
      { from: addressReserve }
    );

    const postBalance = await token.balanceOf(multisigReserve.address);
    const preRealTokens = web3.fromWei(postBalance).toNumber();

    assert.equal(preRealTokens, postRealTokens);
  });

  it("Allows to extract everything from reserve after 36 months", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 1085;
    await reserveTokensHolder.setMockedTime(t);

    await multisigReserve.submitTransaction(
      reserveTokensHolder.address,
      0,
      reserveTokensHolder.contract.collectTokens.getData(),
      { from: addressReserve }
    );

    const balance = await token.balanceOf(multisigReserve.address);
    const realTokens = web3.fromWei(balance).toNumber();

    const calcTokens = maxSupply.mul(0.08).toNumber();

    // Check that tokens exists
    assert(calcTokens > 0);
    assert(realTokens > 0, "No tokens transferred on claim");

    assert.equal(realTokens, calcTokens);
  });
});
