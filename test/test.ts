import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert, expect } from "chai";
import { BigNumber } from "ethers";
import { deployments, ethers } from "hardhat";
import { ETHPool } from "../typechain-types";

describe("ETHPool", () => {
	let ethPool: ETHPool,
		owner: SignerWithAddress,
		teamMember: SignerWithAddress,
		funder1: SignerWithAddress,
		funder2: SignerWithAddress;
	beforeEach(async () => {
		await deployments.fixture(["all"]);
		ethPool = await ethers.getContract("ETHPool", owner);

		const accounts = await ethers.getNamedSigners();
		({ owner, teamMember, funder1, funder2 } = accounts);
		ethPool.connect(owner).addTeamMember(teamMember.address);
	});
	describe("constructor", async () => {});
	describe("deposit", async () => {
		const sendValue = ethers.utils.parseEther("1");
		let magnitude: BigNumber;
		beforeEach(async () => {
			await ethPool.deposit({ value: sendValue });
			magnitude = await ethPool.magnitude();
		});

		it("Increases totalAmount with the deposited amount", async () => {
			const updatedTotalAmount = await ethPool.totalAmount();
			assert.equal(sendValue.toString(), updatedTotalAmount.toString());
		});
		it("Increases addressToAmountFunded of the sender with the deposited amount", async () => {
			const updatedAmountFunded = await ethPool.addressToAmountFunded(owner.address);
			assert.equal(sendValue.toString(), updatedAmountFunded.toString());
		});
		it("Increases the addressToCorrection of the sender", async () => {
			// add reward with a teamMember account so dividendsPerShare is increased
			await ethPool.connect(teamMember).reward({ value: sendValue });
			// deposit some more eth so the correction is updated
			// (correction is added when you deposit eth AFTER rewards are given,
			// because it depends on dividendsPerShare)
			await ethPool.deposit({ value: sendValue });

			const updatedCorrection = await ethPool.addressToCorrection(owner.address);

			// correction = value * dividendsPerShare / magnitude
			const dividendsPerShare = await ethPool.dividendsPerShare();
			const expectedUpdatedCorrection = sendValue.mul(dividendsPerShare).div(magnitude);

			// assert
			assert.equal(updatedCorrection.toString(), expectedUpdatedCorrection.toString());
		});
		it("Emits the Deposit event with params indexed sender and amount", async () => {
			await expect(ethPool.deposit({ value: sendValue }))
				.to.emit(ethPool, "Deposit")
				.withArgs(owner.address, sendValue);
		});
	});
	describe("reward", async () => {});
	describe("withdraw", async () => {});
	describe("withdrawableAmount", async () => {});
	describe("addTeamMember", async () => {});
	describe("removeTeamMember", async () => {});
});
