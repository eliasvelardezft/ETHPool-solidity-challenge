import { ethers } from "hardhat";
import { assert, expect } from "chai";
import { ETHPool__factory } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("ETHPool", () => {
	let ethPoolFactory: ETHPool__factory,
		ethPool: any,
		accounts: SignerWithAddress[],
		owner: SignerWithAddress,
		ownerConnectedEthPool: any,
		funder: SignerWithAddress,
		funderConnectedEthPool: any,
		funderB: SignerWithAddress,
		connectedEthPoolB: any,
		teamMember: SignerWithAddress,
		teamMemberConnectedEthPool: any;
	beforeEach(async () => {
		ethPoolFactory = await ethers.getContractFactory("ETHPool");
		ethPool = await ethPoolFactory.deploy();
		accounts = await ethers.getSigners();
		owner = accounts[0];
		ownerConnectedEthPool = await ethPool.connect(owner);

		funder = accounts[1];
		funderConnectedEthPool = await ethPool.connect(funder);

		funderB = accounts[2];
		connectedEthPoolB = await ethPool.connect(funderB);

		teamMember = accounts[3];
		await ownerConnectedEthPool.addTeamMember(teamMember.address);
		teamMemberConnectedEthPool = await ethPool.connect(teamMember);
	});
	const value1 = ethers.utils.parseEther("1");
	const value100 = ethers.utils.parseEther("100");
	const value150 = ethers.utils.parseEther("150");
	const value200 = ethers.utils.parseEther("200");
	const value300 = ethers.utils.parseEther("300");
	const value450 = ethers.utils.parseEther("450");

	it("Should start with a total amount of 0", async () => {
		const totalAmount = await ethers.provider.getBalance(ethPool.address);
		const expectedTotalAmount = "0";
		assert.equal(totalAmount.toString(), expectedTotalAmount);
	});
	it("Should add the amount a user deposits to the pool", async () => {
		await ethPool.deposit({ value: value1 });
		const updatedTotalAmount = await ethers.provider.getBalance(ethPool.address);

		assert.equal(value1.toString(), updatedTotalAmount.toString());
	});
	it("Should fail if the team rewards with the totalAmount of the pool being 0", async () => {
		await expect(
			teamMemberConnectedEthPool.reward({ value: value1 })
		).to.be.revertedWithCustomError(ethPool, "EmptyPoolReward");
	});
	it("Should update the dividendPerShare when the team gives rewards", async () => {
		// deposit 1 eth so the totalAmount is > 0 and the reward doesn't fail
		await funderConnectedEthPool.deposit({ value: value1 });

		// reward 1 eth
		await teamMemberConnectedEthPool.reward({ value: value1 });

		// the dividendsPerShare should be 1 because we deposited 1 and rewarded 1,
		// so dividendsPerShare is deposit/previousAmount == 1/1 == 1
		const magnitude = await ethPool.magnitude();
		const expectedDividensPerShare = magnitude * 1;
		const updatedDividensPerShare = await funderConnectedEthPool.dividendsPerShare();
		assert.equal(expectedDividensPerShare, updatedDividensPerShare);
	});
	it("Should update(+) the correction[address] when the address makes a deposit", async () => {
		// deposit 1 eth so the totalAmount is > 0 and the reward doesn't fail
		await funderConnectedEthPool.deposit({ value: value1 });

		// we add a reward so the dividendsPerShare is increased from its initial value of 0
		await teamMemberConnectedEthPool.reward({ value: value1 });

		// then we make a deposit
		await funderConnectedEthPool.deposit({ value: value1 });
		const correction = await ethPool.addressToCorrection(funder.address);
		const dividendsPerShare = await ethPool.dividendsPerShare();
		const magnitude = await ethPool.magnitude();

		const expectedCorrection = (dividendsPerShare * Number(value1)) / magnitude;
		assert.equal(expectedCorrection, correction);
	});
	it("Should update(-) the correction[address] when the address makes a withdrawal", async () => {
		// deposit 1 eth so the totalAmount is > 0 and the reward doesn't fail
		await funderConnectedEthPool.deposit({ value: value200 });

		// we add a reward so the dividendsPerShare is increased from its initial value of 0
		await teamMemberConnectedEthPool.reward({ value: value200 });

		// then we make another deposit
		await funderConnectedEthPool.deposit({ value: value100 });

		// // then we withdraw
		await funderConnectedEthPool.withdraw();

		const correction = await ethPool.addressToCorrection(funder.address);

		assert.equal(Number(correction), 0);
	});
	it("Should transfer to the address when the address makes a withdrawal", async () => {
		const funderBalance = await funder.getBalance();

		// deposit 1 eth so we can withdraw later
		const depositTx = await funderConnectedEthPool.deposit({
			value: value100,
		});
		const d = await depositTx.wait(1);
		const depositGasCost = d.gasUsed * d.effectiveGasPrice;

		// withdraw
		const withdrawTx = await funderConnectedEthPool.withdraw();
		const w = await withdrawTx.wait(1);
		const withdrawGasCost = w.gasUsed * w.effectiveGasPrice;

		// new balance should be the original - gas used for deposit and withdrawal
		const expectedBalance = Number(funderBalance) - depositGasCost - withdrawGasCost;
		const updatedBalance = await funder.getBalance();

		assert.equal(expectedBalance, Number(updatedBalance));
	});
	// The next test describes the first situation presented in the github repo of the challenge
	// A deposits 100, and B deposits 300 for a total of 400 in the pool.
	// Now A has 25% of the pool and B has 75%.
	// When T deposits 200 rewards, A should be able to withdraw 150 and B 450.
	it("Situation 1", async () => {
		// A deposits 100
		await funderConnectedEthPool.deposit({ value: value100 });

		// B deposits 300
		await connectedEthPoolB.deposit({ value: value300 });

		// T rewards 200
		await teamMemberConnectedEthPool.reward({ value: value200 });

		const withdrawableAmountA = await ethPool.withdrawableAmount(funder.address);
		const withdrawableAmountB = await ethPool.withdrawableAmount(funderB.address);

		assert.equal(withdrawableAmountA.toString(), value150.toString());
		assert.equal(withdrawableAmountB.toString(), value450.toString());
	});
	// The next test describes the second situation presented in the github repo of the challenge
	// Let say we have user A and B and team T.
	// A deposits 100, and B deposits 300 for a total of 400 in the pool.
	// Now A has 25% of the pool and B has 75%.
	// When T deposits 200 rewards, A should be able to withdraw 150 and B 450.
	// What if the following happens?
	// A deposits then T deposits then B deposits then A withdraws and finally B withdraws.
	// A should get their deposit + all the rewards.
	// B should only get their deposit because rewards were sent to the pool before they participated.
	it("Situation 2", async () => {
		// A deposits 100
		await funderConnectedEthPool.deposit({ value: value100 });

		// T rewards 200
		await teamMemberConnectedEthPool.reward({ value: value200 });

		// B deposits 200
		await connectedEthPoolB.deposit({ value: value200 });

		const withdrawableAmountA = await ethPool.withdrawableAmount(funder.address);
		const withdrawableAmountB = await ethPool.withdrawableAmount(funderB.address);

		// A gets 300 because they deposited 100 and T rewarded 200
		// BEFORE B deposited 200, so B only gets 200.
		assert.equal(withdrawableAmountA.toString(), value300.toString());
		assert.equal(withdrawableAmountB.toString(), value200.toString());
	});
});
