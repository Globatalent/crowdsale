// Simulate a full contribution

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
const toUnit = require("./helpers/toUnit.js");
const fromUnit = require("./helpers/fromUnit.js");
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

  const maxSupply = new BigNumber("1e7"); // 10 millions
  const amountToSale = new BigNumber("5e6"); // 5 millions
  const percentToSale = 50; // Percentage of coins for the ico

  const totalSupplyWithoutSale = maxSupply.mul(percentToSale).div(100);

  const exchangeRate = 1;

  it("Deploys all contracts", async () => {
    miniMeTokenFactory = await MiniMeTokenFactory.new();

    token = await Token.new(miniMeTokenFactory.address);
    tokenContribution = await TokenContributionClass.new();

    teamTokensHolder = await TeamTokensHolder.new(
      addressTeam,
      tokenContribution.address,
      token.address
    );

    reserveTokensHolder = await ReserveTokensHolder.new(
      addressReserve,
      tokenContribution.address,
      token.address
    );

    bountiesTokensHolder = await BountiesTokensHolder.new(
      addressReserve,
      tokenContribution.address,
      token.address
    );

    airdropTokensHolder = await AirdropTokensHolder.new(
      addressAirdrop,
      tokenContribution.address,
      token.address
    );

    advisorsTokensHolder = await AdvisorsTokensHolder.new(
      addressAdvisors,
      tokenContribution.address,
      token.address
    );

    earlyInvestorsTokensHolder = await EarlyInvestorsTokensHolder.new(
      addressEarlyInvestors,
      tokenContribution.address,
      token.address
    );

    tokenPlaceHolder = await TokenPlaceHolderClass.new(
      addressTokenHolder,
      token.address,
      tokenContribution.address
    );

    await token.changeController(tokenContribution.address);

    await tokenContribution.initialize(
      token.address,

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

  it("Moves time to start of the crowdsale, and does the first generate", async () => {
    tokenContribution.generate(addressToken, toUnit(1, 8));

    await tokenContribution.setMockedBlockNumber(1015000);
    await token.setMockedBlockNumber(1015000);

    const balance = await token.balanceOf(addressToken);

    assert.equal(fromUnit(balance, 8).toNumber(), 1 * exchangeRate);
  });

  it("Doesn't allow transfers after the finalize", async () => {
    await assertFail(async () => {
      await token.transfer(addressToken, toUnit(1, 8));
    });
  });

  it("Finalizes", async () => {
    const tokensIssuedPreFinalize = await tokenContribution.tokensIssued();

    await tokenContribution.finalize();

    const currentSupply = totalSupplyWithoutSale.add(
      fromUnit(tokensIssuedPreFinalize, 8)
    );

    const tokensIssued = await tokenContribution.tokensIssued();

    assert.equal(
      tokensIssued.toNumber(),
      toUnit(currentSupply, 8).toNumber(),
      "total supply"
    );

    const balanceTeam = await token.balanceOf(teamTokensHolder.address);
    assert.equal(
      balanceTeam.toNumber(),
      toUnit(maxSupply, 8)
        .mul(0.18)
        .toNumber(),
      "team"
    );

    const balanceReserve = await token.balanceOf(reserveTokensHolder.address);
    assert.equal(
      balanceReserve.toNumber(),
      toUnit(maxSupply, 8)
        .mul(0.08)
        .toNumber(),
      "reserve"
    );

    const balanceBounties = await token.balanceOf(bountiesTokensHolder.address);
    assert.equal(
      balanceBounties.toNumber(),
      toUnit(maxSupply, 8)
        .mul(0.13)
        .toNumber(),
      "bounties"
    );

    const balanceAirdrop = await token.balanceOf(airdropTokensHolder.address);
    assert.equal(
      balanceAirdrop.toNumber(),
      toUnit(maxSupply, 8)
        .mul(0.02)
        .toNumber(),
      "airdrop"
    );

    const balanceAdvisors = await token.balanceOf(advisorsTokensHolder.address);
    assert.equal(
      balanceAdvisors.toNumber(),
      toUnit(maxSupply, 8)
        .mul(0.07)
        .toNumber(),
      "advisors"
    );

    const balanceEarlyInvestors = await token.balanceOf(
      earlyInvestorsTokensHolder.address
    );
    assert.equal(
      balanceEarlyInvestors.toNumber(),
      toUnit(maxSupply, 8)
        .mul(0.02)
        .toNumber(),
      "early investors"
    );
  });

  it("Check generate after finalize", async () => {
    tokenContribution.generate(addressToken, toUnit(1, 8));

    await tokenContribution.setMockedBlockNumber(1060000);
    await token.setMockedBlockNumber(1060000);

    const balance = await token.balanceOf(addressToken);

    assert.equal(fromUnit(balance, 8).toNumber(), 2 * exchangeRate);
  });

  it("Allows transfers after finalize", async () => {
    await token.transfer(addressDummy2, toUnit(1, 8));

    const balance2 = await token.balanceOf(addressDummy2);

    assert.equal(fromUnit(balance2, 8).toNumber(), 1);
  });

  it("Check sale limit", async () => {
    await tokenContribution.setMockedBlockNumber(1070000);
    await token.setMockedBlockNumber(1070000);

    let tokensIssued = await tokenContribution.tokensIssued();

    let remaining = maxSupply.sub(fromUnit(tokensIssued, 8));

    await tokenContribution.generate(addressToken, toUnit(remaining.toNumber(), 8));

    await assertFail(async () => {
      await tokenContribution.generate(addressToken, toUnit(1, 8));
    });
  });

  it("Checks that Token's Controller is upgradeable", async () => {
    await tokenContribution.changeController(tokenPlaceHolder.address);

    const controller = await token.controller();

    assert.equal(controller, tokenPlaceHolder.address);
  });
});
