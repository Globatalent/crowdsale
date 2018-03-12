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
  const endBlock = 1030000;

  const maxSupply = new BigNumber("1e9"); // 6 billions in ethers
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
      addressBounties,
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
    await tokenContribution.setMockedBlockNumber(endBlock + 1);
    await tokenContribution.finalize();

    await token.setMockedBlockNumber(1100000);
  });

  it("Disallows team from transfering before 12 months have past", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 340;
    await teamTokensHolder.setMockedTime(t);

    await token.setMockedBlockNumber(1200000);

    // This function will fail in the multisig
    await assertFail(async () => {
      await teamTokensHolder.collectTokens({ from: addressTeam });
    });
  });

  it("Allows team to extract 40% after 12 months", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 363;
    await teamTokensHolder.setMockedTime(t);
    
    await token.setMockedBlockNumber(1300000);
    
    await teamTokensHolder.collectTokens({ from: addressTeam });

    const balance = await token.balanceOf(addressTeam);

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

  it("Disallow to extract from 40% from team again", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 361;
    await teamTokensHolder.setMockedTime(t);

    await assertFail(async () => {
      await teamTokensHolder.collectTokens({ from: addressTeam });
    });
  });

  it("Allows team to extract 80% after 24 months", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 721;
    await teamTokensHolder.setMockedTime(t);

    await teamTokensHolder.collectTokens({ from: addressTeam });

    await token.setMockedBlockNumber(1400000);

    const balance = await token.balanceOf(addressTeam);

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

  it("Disallow to extract from 80% from team again", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 721;
    await teamTokensHolder.setMockedTime(t);

    await assertFail(async () => {
      await teamTokensHolder.collectTokens({ from: addressTeam });
    });
  });

  it("Allows team to extract everything after 36 months", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 1080 + 10; // 10 second after 36 months
    await teamTokensHolder.setMockedTime(t);

    await teamTokensHolder.collectTokens({ from: addressTeam });

    await token.setMockedBlockNumber(1500000);

    const balance = await token.balanceOf(addressTeam);

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

    await assertFail(async () => {
      await reserveTokensHolder.collectTokens({ from: addressReserve });
    });
  });

  it("Allows to extract 50% from reserve after 18 months", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 540 + 10;
    await reserveTokensHolder.setMockedTime(t);

    await reserveTokensHolder.collectTokens({ from: addressReserve });

    await token.setMockedBlockNumber(1600000);

    const balance = await token.balanceOf(addressReserve);

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

  it("Disallow to extract 50% from reserve again", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 542;
    await reserveTokensHolder.setMockedTime(t);

    await assertFail(async () => {
      await reserveTokensHolder.collectTokens({ from: addressReserve });
    });
  });

  it("Allows to extract everything from reserve after 36 months", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 1085;
    await reserveTokensHolder.setMockedTime(t);

    await reserveTokensHolder.collectTokens({ from: addressReserve });

    await token.setMockedBlockNumber(1700000);

    const balance = await token.balanceOf(addressReserve);
    const realTokens = web3.fromWei(balance).toNumber();

    const calcTokens = maxSupply.mul(0.08).toNumber();

    // Check that tokens exists
    assert(calcTokens > 0);
    assert(realTokens > 0, "No tokens transferred on claim");

    assert.equal(realTokens, calcTokens);
  });

  it("Disallows airdrop from transfering before 3 months have past", async () => {
    const t = (await tokenContribution.finalizedTime()).toNumber() + 86400 * 89;
    await airdropTokensHolder.setMockedTime(t);

    await assertFail(async () => {
      await airdropTokensHolder.collectTokens({ from: addressAirdrop });
    });
  });

  it("Allows airdrop to extract 25% after 3 months", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 90 + 10;
    await airdropTokensHolder.setMockedTime(t);

    await airdropTokensHolder.collectTokens({ from: addressAirdrop });

    await token.setMockedBlockNumber(1800000);

    const balance = await token.balanceOf(addressAirdrop);

    const calcTokens = maxSupply
      .mul(0.02)
      .mul(0.25)
      .toNumber();
    const realTokens = web3.fromWei(balance).toNumber();

    // Check that tokens exists
    assert(calcTokens > 0);
    assert(realTokens > 0, "No tokens transferred on claim");

    assert.equal(realTokens, calcTokens);
  });

  it("Disallow to extract from 25% from airdrop again", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 90 + 10;
    await airdropTokensHolder.setMockedTime(t);

    await assertFail(async () => {
      await airdropTokensHolder.collectTokens({ from: addressAirdrop });
    });
  });

  it("Allows airdrop to extract 50% after 6 months", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 180 + 10;
    await airdropTokensHolder.setMockedTime(t);

    await airdropTokensHolder.collectTokens({ from: addressAirdrop });

    await token.setMockedBlockNumber(1900000);

    const balance = await token.balanceOf(addressAirdrop);

    const calcTokens = maxSupply
      .mul(0.02)
      .mul(0.5)
      .toNumber();
    const realTokens = web3.fromWei(balance).toNumber();

    // Check that tokens exists
    assert(calcTokens > 0);
    assert(realTokens > 0, "No tokens transferred on claim");

    assert.equal(realTokens, calcTokens);
  });

  it("Disallow to extract from 50% from airdrop again", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 180 + 10;
    await airdropTokensHolder.setMockedTime(t);

    await assertFail(async () => {
      await airdropTokensHolder.collectTokens({ from: addressAirdrop });
    });
  });

  it("Allows airdrop to extract 75% after 9 months", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 270 + 10;
    await airdropTokensHolder.setMockedTime(t);

    await airdropTokensHolder.collectTokens({ from: addressAirdrop });

    await token.setMockedBlockNumber(2000000);

    const balance = await token.balanceOf(addressAirdrop);

    const calcTokens = maxSupply
      .mul(0.02)
      .mul(0.75)
      .toNumber();
    const realTokens = web3.fromWei(balance).toNumber();

    // Check that tokens exists
    assert(calcTokens > 0);
    assert(realTokens > 0, "No tokens transferred on claim");

    assert.equal(realTokens, calcTokens);
  });

  it("Disallow to extract from 75% from airdrop again", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 270 + 10;
    await airdropTokensHolder.setMockedTime(t);

    await assertFail(async () => {
      await airdropTokensHolder.collectTokens({ from: addressAirdrop });
    });
  });

  it("Allows airdrop to extract everything after 12 months", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 360 + 10;
    await airdropTokensHolder.setMockedTime(t);

    await airdropTokensHolder.collectTokens({ from: addressAirdrop });

    await token.setMockedBlockNumber(2100000);

    const balance = await token.balanceOf(addressAirdrop);

    const calcTokens = maxSupply
      .mul(0.02)
      .mul(1)
      .toNumber();
    const realTokens = web3.fromWei(balance).toNumber();

    // Check that tokens tokens exists
    assert(calcTokens > 0);
    assert(realTokens > 0, "No tokens transferred on claim");

    assert.equal(realTokens, calcTokens);
  });

  it("Disallows advisors from transfering before 2 months have past", async () => {
    const t = (await tokenContribution.finalizedTime()).toNumber() + 86400 * 59;
    await advisorsTokensHolder.setMockedTime(t);

    await assertFail(async () => {
      await advisorsTokensHolder.collectTokens({ from: addressAdvisors });
    });
  });

  it("Allows advisors to extract 20% after 2 months", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 60 + 10;
    await advisorsTokensHolder.setMockedTime(t);

    await advisorsTokensHolder.collectTokens({ from: addressAdvisors });

    await token.setMockedBlockNumber(2200000);

    const balance = await token.balanceOf(addressAdvisors);

    const calcTokens = maxSupply
      .mul(0.07)
      .mul(0.2)
      .toNumber();
    const realTokens = web3.fromWei(balance).toNumber();

    // Check that tokens exists
    assert(calcTokens > 0);
    assert(realTokens > 0, "No tokens transferred on claim");

    assert.equal(realTokens, calcTokens);
  });

  it("Disallow to extract from 20% from advisors again", async () => {
    const t = (await tokenContribution.finalizedTime()).toNumber() + 86400 * 61;
    await advisorsTokensHolder.setMockedTime(t);

    await assertFail(async () => {
      await advisorsTokensHolder.collectTokens({ from: addressAdvisors });
    });
  });

  it("Allows advisors to extract 40% after 3 months", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 90 + 10;
    await advisorsTokensHolder.setMockedTime(t);

    await advisorsTokensHolder.collectTokens({ from: addressAdvisors });

    await token.setMockedBlockNumber(2300000);

    const balance = await token.balanceOf(addressAdvisors);

    const calcTokens = maxSupply
      .mul(0.07)
      .mul(0.4)
      .toNumber();
    const realTokens = web3.fromWei(balance).toNumber();

    // Check that tokens exists
    assert(calcTokens > 0);
    assert(realTokens > 0, "No tokens transferred on claim");

    assert.equal(realTokens, calcTokens);
  });

  it("Disallow to extract from 40% from airdrop again", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 90 + 10;
    await advisorsTokensHolder.setMockedTime(t);

    await assertFail(async () => {
      await advisorsTokensHolder.collectTokens({ from: addressAdvisors });
    });
  });

  it("Allows advisors to extract 60% after 4 months", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 120 + 10;
    await advisorsTokensHolder.setMockedTime(t);

    await advisorsTokensHolder.collectTokens({ from: addressAdvisors });

    await token.setMockedBlockNumber(2400000);

    const balance = await token.balanceOf(addressAdvisors);

    const calcTokens = maxSupply
      .mul(0.07)
      .mul(0.6)
      .toNumber();
    const realTokens = web3.fromWei(balance).toNumber();

    // Check that tokens exists
    assert(calcTokens > 0);
    assert(realTokens > 0, "No tokens transferred on claim");

    assert.equal(realTokens, calcTokens);
  });

  it("Disallow to extract from 60% from advisors again", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 120 + 10;
    await advisorsTokensHolder.setMockedTime(t);

    await assertFail(async () => {
      await advisorsTokensHolder.collectTokens({ from: addressAdvisors });
    });
  });

  it("Allows advisors to extract 80% after 5 months", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 150 + 10;
    await advisorsTokensHolder.setMockedTime(t);

    await advisorsTokensHolder.collectTokens({ from: addressAdvisors });

    await token.setMockedBlockNumber(2500000);

    const balance = await token.balanceOf(addressAdvisors);

    const calcTokens = maxSupply
      .mul(0.07)
      .mul(0.8)
      .toNumber();
    const realTokens = web3.fromWei(balance).toNumber();

    // Check that tokens exists
    assert(calcTokens > 0);
    assert(realTokens > 0, "No tokens transferred on claim");

    assert.equal(realTokens, calcTokens);
  });

  it("Disallow to extract from 80% from advisors again", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 150 + 10;
    await advisorsTokensHolder.setMockedTime(t);

    await assertFail(async () => {
      await advisorsTokensHolder.collectTokens({ from: addressAdvisors });
    });
  });

  it("Allows advisors to extract everything after 6 months", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 180 + 10;
    await advisorsTokensHolder.setMockedTime(t);

    await advisorsTokensHolder.collectTokens({ from: addressAdvisors });

    await token.setMockedBlockNumber(2600000);

    const balance = await token.balanceOf(addressAdvisors);

    const calcTokens = maxSupply
      .mul(0.07)
      .mul(1)
      .toNumber();
    const realTokens = web3.fromWei(balance).toNumber();

    // Check that tokens tokens exists
    assert(calcTokens > 0);
    assert(realTokens > 0, "No tokens transferred on claim");

    assert.equal(realTokens, calcTokens);
  });

  it("Disallows bounty from transfering before crowdsale has ended", async () => {
    const t = (await tokenContribution.finalizedTime()).toNumber();
    await bountiesTokensHolder.setMockedTime(t);

    await assertFail(async () => {
      await bountiesTokensHolder.collectTokens({ from: addressBounties });
    });
  });

  it("Allows to extract everything from bounty after crowdsale has ended", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 60 + 10;
    await bountiesTokensHolder.setMockedTime(t);

    await bountiesTokensHolder.collectTokens({ from: addressBounties });

    await token.setMockedBlockNumber(2700000);

    const balance = await token.balanceOf(addressBounties);

    const calcTokens = maxSupply.mul(0.13).toNumber();
    const realTokens = web3.fromWei(balance).toNumber();

    // Check that tokens exists
    assert(calcTokens > 0);
    assert(realTokens > 0, "No tokens transferred on claim");

    assert.equal(realTokens, calcTokens);
  });

  it("Disallows early investors from transfering before 1 day have past", async () => {
    const t = (await tokenContribution.finalizedTime()).toNumber();
    await earlyInvestorsTokensHolder.setMockedTime(t);

    await assertFail(async () => {
      await earlyInvestorsTokensHolder.collectTokens({
        from: addressEarlyInvestors
      });
    });
  });

  it("Allows early investors to extract 40% after 1 day", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 1 + 10;
    await earlyInvestorsTokensHolder.setMockedTime(t);

    await earlyInvestorsTokensHolder.collectTokens({
      from: addressEarlyInvestors
    });

    await token.setMockedBlockNumber(2800000);

    const balance = await token.balanceOf(addressEarlyInvestors);

    const calcTokens = maxSupply
      .mul(0.02)
      .mul(0.4)
      .toNumber();
    const realTokens = web3.fromWei(balance).toNumber();

    // Check that tokens exists
    assert(calcTokens > 0);
    assert(realTokens > 0, "No tokens transferred on claim");

    assert.equal(realTokens, calcTokens);
  });

  it("Disallow to extract from 40% from early investors again", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 1 + 10;
    await earlyInvestorsTokensHolder.setMockedTime(t);

    await assertFail(async () => {
      await earlyInvestorsTokensHolder.collectTokens({ from: addressEarlyInvestors });
    });
  });

  it("Allows early investors to extract 60% after 3 months", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 90 + 10;
    await earlyInvestorsTokensHolder.setMockedTime(t);

    await earlyInvestorsTokensHolder.collectTokens({
      from: addressEarlyInvestors
    });

    await token.setMockedBlockNumber(2900000);

    const balance = await token.balanceOf(addressEarlyInvestors);

    const calcTokens = maxSupply
      .mul(0.02)
      .mul(0.6)
      .toNumber();
    const realTokens = web3.fromWei(balance).toNumber();

    // Check that tokens exists
    assert(calcTokens > 0);
    assert(realTokens > 0, "No tokens transferred on claim");

    assert.equal(realTokens, calcTokens);
  });

  it("Disallow to extract from 60% from early investors again", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 90 + 10;
    await earlyInvestorsTokensHolder.setMockedTime(t);

    await assertFail(async () => {
      await advisorsTokensHolder.collectTokens({ from: addressEarlyInvestors });
    });
  });

  it("Allows early investors to extract 80% after 9 months", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() +
      86400 * 180 +
      10;
    await earlyInvestorsTokensHolder.setMockedTime(t);

    await earlyInvestorsTokensHolder.collectTokens({
      from: addressEarlyInvestors
    });

    await token.setMockedBlockNumber(3000000);

    const balance = await token.balanceOf(addressEarlyInvestors);

    const calcTokens = maxSupply
      .mul(0.02)
      .mul(0.8)
      .toNumber();
    const realTokens = web3.fromWei(balance).toNumber();

    // Check that tokens exists
    assert(calcTokens > 0);
    assert(realTokens > 0, "No tokens transferred on claim");

    assert.equal(realTokens, calcTokens);
  });

  it("Disallow to extract from 80% from early investors again", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 180 + 10;
    await earlyInvestorsTokensHolder.setMockedTime(t);

    await assertFail(async () => {
      await earlyInvestorsTokensHolder.collectTokens({
        from: addressEarlyInvestors
      });
    });
  });

  it("Allows early investors to extract everything after 9 months", async () => {
    const t =
      (await tokenContribution.finalizedTime()).toNumber() + 86400 * 270 + 10;
    await earlyInvestorsTokensHolder.setMockedTime(t);

    await earlyInvestorsTokensHolder.collectTokens({
      from: addressEarlyInvestors
    });

    await token.setMockedBlockNumber(3100000);

    const balance = await token.balanceOf(addressEarlyInvestors);

    const calcTokens = maxSupply.mul(0.02).toNumber();
    const realTokens = web3.fromWei(balance).toNumber();

    // Check that tokens tokens exists
    assert(calcTokens > 0);
    assert(realTokens > 0, "No tokens transferred on claim");

    assert.equal(realTokens, calcTokens);
  });
});
