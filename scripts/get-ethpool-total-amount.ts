import { ethers } from "hardhat";

const ETHPOOL_CONTRACT_ADDRESS = process.env.ETHPOOL_CONTRACT_ADDRESS;

const main = async () => {
	// read total amount in the pool of the contract
	const totalAmount = await ethers.provider.getBalance(
		ETHPOOL_CONTRACT_ADDRESS!
	);
	console.log(`Current total amount in pool is: ${totalAmount.toString()}`);
};

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
