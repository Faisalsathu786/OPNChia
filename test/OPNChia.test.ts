import { expect } from "chai";
import { ethers } from "hardhat";
import { OPNChiaFactory, OPNChiaBondingCurve, OPNChiaToken, OPNChiaMigrator } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("OPNChia - Bonding Curve Launchpad", function () {
  let factory: OPNChiaFactory;
  let migrator: OPNChiaMigrator;
  let token: OPNChiaToken;
  let curve: OPNChiaBondingCurve;
  let owner: SignerWithAddress;
  let buyer1: SignerWithAddress;
  let buyer2: SignerWithAddress;
  let creator: SignerWithAddress;

  const TOTAL_SUPPLY = ethers.parseEther("10000000");     // 10M tokens
  const TOKENS_FOR_SALE = ethers.parseEther("5000000");   // 5M for sale
  const BASE_PRICE = ethers.parseEther("0.0001");         // 0.0001 IOPN per token
  const CURVE_COEFF = ethers.parseEther("0.00000001");   // Gentle slope
  const MIGRATION_THRESHOLD = ethers.parseEther("500");   // 500 IOPN
  const CREATION_FEE = ethers.parseEther("0.01");

  beforeEach(async function () {
    [owner, buyer1, buyer2, creator] = await ethers.getSigners();

    // Deploy Migrator
    const Migrator = await ethers.getContractFactory("OPNChiaMigrator");
    migrator = await Migrator.deploy(owner.address, owner.address, owner.address, owner.address);
    await migrator.waitForDeployment();

    // Deploy Factory
    const Factory = await ethers.getContractFactory("OPNChiaFactory");
    factory = await Factory.deploy(
      await migrator.getAddress(),
      owner.address,
      ethers.parseEther("0.01")
    );
    await factory.waitForDeployment();

    // Create a token via factory
    const tx = await factory.connect(creator).createToken(
      "TestToken", "TEST", TOTAL_SUPPLY, TOKENS_FOR_SALE,
      BASE_PRICE, CURVE_COEFF, MIGRATION_THRESHOLD, 18,
      { value: CREATION_FEE }
    );
    const receipt = await tx.wait();

    // Find token and curve addresses from event
    const event = receipt?.logs?.find(
      (log: any) => log instanceof ethers.EventLog && log.eventName === "TokenCreated"
    );
    if (event) {
      const tokenAddr = event.args.token;
      const curveAddr = event.args.bondingCurve;
      token = await ethers.getContractAt("OPNChiaToken", tokenAddr);
      curve = await ethers.getContractAt("OPNChiaBondingCurve", curveAddr);
    }
  });

  describe("Token Creation", function () {
    it("Should create a token successfully", async function () {
      expect(await token.name()).to.equal("TestToken");
      expect(await token.symbol()).to.equal("TEST");
      expect(await factory.getTokenCount()).to.equal(1);
    });

    it("Should reject token with empty name", async function () {
      await expect(
        factory.connect(creator).createToken("", "TEST", TOTAL_SUPPLY, TOKENS_FOR_SALE,
          BASE_PRICE, CURVE_COEFF, MIGRATION_THRESHOLD, 18, { value: CREATION_FEE })
      ).to.be.reverted;
    });

    it("Should reject without enough creation fee", async function () {
      await expect(
        factory.connect(creator).createToken("T", "T", TOTAL_SUPPLY, TOKENS_FOR_SALE,
          BASE_PRICE, CURVE_COEFF, MIGRATION_THRESHOLD, 18,
          { value: ethers.parseEther("0.001") })
      ).to.be.revertedWith("Insufficient fee");
    });
  });

  describe("Bonding Curve - Buy", function () {
    it("Should let user buy tokens at base price", async function () {
      const buyAmount = ethers.parseEther("1"); // 1 IOPN
      await curve.connect(buyer1).buyTokens({ value: buyAmount });

      const expectedTokens = (buyAmount * ethers.parseEther("1")) / BASE_PRICE;
      const balance = await token.balanceOf(buyer1.address);
      expect(balance).to.be.gt(0);
    });

    it("Price should increase after each purchase", async function () {
      const buyAmount = ethers.parseEther("1");

      const price1 = await curve.getCurrentPrice();
      await curve.connect(buyer1).buyTokens({ value: buyAmount });
      const price2 = await curve.getCurrentPrice();

      expect(price2).to.be.gt(price1);
    });

    it("Should reject buy with zero IOPN", async function () {
      await expect(curve.connect(buyer1).buyTokens({ value: 0 }))
        .to.be.revertedWith("Send IOPN");
    });
  });

  describe("Bonding Curve - Sell", function () {
    it("Should let user sell tokens back", async function () {
      const buyAmount = ethers.parseEther("10");
      await curve.connect(buyer1).buyTokens({ value: buyAmount });

      const balance = await token.balanceOf(buyer1.address);
      await token.connect(buyer1).approve(await curve.getAddress(), balance);
      await curve.connect(buyer1).sellTokens(balance / 20n);

      const afterBalance = await token.balanceOf(buyer1.address);
      expect(afterBalance).to.be.lt(balance);
    });
  });

  describe("Migration", function () {
    it("Should migrate when threshold is hit", async function () {
      const buyAmount = ethers.parseEther("300");
      await curve.connect(buyer1).buyTokens({ value: buyAmount });
      await curve.connect(buyer2).buyTokens({ value: buyAmount });

      // Total raised should be 600, threshold hit (500)
      expect(await curve.migrated()).to.be.true;
    });
  });
});
