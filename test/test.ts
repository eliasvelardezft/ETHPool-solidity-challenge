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
		funder2: SignerWithAddress,
		magnitude: BigNumber,
		DEFAULT_ADMIN_ROLE: string,
		TEAM_MEMBER_ROLE: string;
	const sendValue = ethers.utils.parseEther("1");
	beforeEach(async () => {
		await deployments.fixture(["all"]);
		ethPool = await ethers.getContract("ETHPool", owner);

		const accounts = await ethers.getNamedSigners();
		({ owner, teamMember, funder1, funder2 } = accounts);
		ethPool.connect(owner).addTeamMember(teamMember.address);

		magnitude = await ethPool.magnitude();
		DEFAULT_ADMIN_ROLE = await ethPool.DEFAULT_ADMIN_ROLE();
		TEAM_MEMBER_ROLE = await ethPool.TEAM_MEMBER_ROLE();
	});
	describe("constructor", async () => {
		it("Sets the deployer as OpenZeppelin DEFAULT_ADMIN_ROLE", async () => {
			const isAdmin = await ethPool.hasRole(DEFAULT_ADMIN_ROLE, owner.address);
			assert.isTrue(isAdmin);
		});
		it("Sets the deployer as TEAM_MEMBER (so they can also reward)", async () => {
			const TEAM_MEMBER_ROLE = await ethPool.TEAM_MEMBER_ROLE();
			const isTeamMember = await ethPool.hasRole(TEAM_MEMBER_ROLE, owner.address);
			assert.isTrue(isTeamMember);
		});
	});
	describe("deposit", async () => {
		beforeEach(async () => {
			await ethPool.deposit({ value: sendValue });
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
		it("Emits the Deposit event with params sender and amount", async () => {
			await expect(ethPool.deposit({ value: sendValue }))
				.to.emit(ethPool, "Deposit")
				.withArgs(owner.address, sendValue);
		});
	});
	describe("reward", async () => {
		it("Reverts the reward with EmptyPoolReward error if the pool is empty", async () => {
			await expect(
				ethPool.connect(teamMember).reward({ value: sendValue })
			).to.be.revertedWithCustomError(ethPool, "ETHPool__EmptyPoolReward");
		});
		it("Increases the dividendsPerShare when a reward is given", async () => {
			// deposit some eth so a reward can be given without reverting
			await ethPool.deposit({ value: sendValue });
			const totalAmountBeforeReward = await ethPool.totalAmount();

			ethPool.connect(teamMember).reward({ value: sendValue });
			const updatedDividendsPerShare = await ethPool.dividendsPerShare();
			const expectedUpdatedDividendsPerShare = sendValue
				.mul(magnitude)
				.div(totalAmountBeforeReward);

			assert.equal(
				updatedDividendsPerShare.toString(),
				expectedUpdatedDividendsPerShare.toString()
			);
		});
		it("Increases the totalAmount with the rewarded amount", async () => {
			// deposit some eth so a reward can be given without reverting
			await ethPool.deposit({ value: sendValue });

			const totalAmountBeforeReward = await ethPool.totalAmount();

			ethPool.connect(teamMember).reward({ value: sendValue });

			const updatedTotalAmount = await ethPool.totalAmount();
			const expectedUpdatedTotalAmount = totalAmountBeforeReward.add(sendValue);

			assert.equal(updatedTotalAmount.toString(), expectedUpdatedTotalAmount.toString());
		});
		it("Emits the Deposit event with param amount", async () => {
			// deposit some eth so a reward can be given without reverting
			await ethPool.deposit({ value: sendValue });

			await expect(ethPool.connect(teamMember).reward({ value: sendValue }))
				.to.emit(ethPool, "Reward")
				.withArgs(sendValue);
		});
	});
	describe("withdraw", async () => {
		beforeEach(async () => {
			await ethPool.connect(funder1).deposit({ value: sendValue });
		});
		it("Empties the senders amountFunded", async () => {
			await ethPool.connect(funder1).withdraw();
			const updatedAmountFunded = await ethPool.addressToAmountFunded(funder1.address);
			assert.equal(updatedAmountFunded.toString(), "0");
		});
		it("Empties the senders correction", async () => {
			await ethPool.connect(funder1).withdraw();
			const updatedCorrection = await ethPool.addressToCorrection(funder1.address);
			assert.equal(updatedCorrection.toString(), "0");
		});
		it("Transfers the corrected withdrawable amount to the sender", async () => {
			const balanceBeforeWithdrawal = await ethPool.provider.getBalance(funder1.address);

			const withdrawTxResponse = await ethPool.connect(funder1).withdraw();
			const withdrawTxReceipt = await withdrawTxResponse.wait();
			const { gasUsed, effectiveGasPrice } = withdrawTxReceipt;

			const updatedBalance = await ethPool.provider.getBalance(funder1.address);
			const expectedUpdatedBalance = balanceBeforeWithdrawal
				.add(sendValue)
				.sub(gasUsed.mul(effectiveGasPrice));
			assert.equal(updatedBalance.toString(), expectedUpdatedBalance.toString());
		});
		it("Emits Withdrawal event with params sender, amount", async () => {
			await expect(await ethPool.connect(funder1).withdraw())
				.to.emit(ethPool, "Withdrawal")
				.withArgs(funder1.address, sendValue);
		});
	});
	describe("withdrawableAmount", async () => {});
	describe("addTeamMember", async () => {});
	describe("removeTeamMember", async () => {});
});
