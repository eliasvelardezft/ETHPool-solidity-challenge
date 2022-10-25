import { ethers, run, network } from "hardhat";

const GOERLI_CHAINID = process.env.GOERLI_CHAINID;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

const main = async () => {
	const ETHPoolFactory = await ethers.getContractFactory("ETHPool");
	console.log("deploying contract...");
	const ethPool = await ETHPoolFactory.deploy();
	await ethPool.deployed();
	console.log(`deployed to: ${ethPool.address}`);
	// call verify function if goerli was used as the network in the run command
	if (network.config.chainId == GOERLI_CHAINID && ETHERSCAN_API_KEY) {
		await ethPool.deployTransaction.wait(6);
		await verify(ethPool.address, []);
	}
};

const verify = async (contractAddress: string, args: any[]) => {
	console.log("verifying contract...");
	try {
		await run("verify:verify", {
			address: contractAddress,
			constructorArguments: args,
		});
	} catch (error: any) {
		if (error.message.toLowerCase().includes("already verified")) {
			console.log("already verified!");
		} else {
			console.log(error.message);
		}
	}
};

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
