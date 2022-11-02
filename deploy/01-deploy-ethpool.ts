import { network } from "hardhat";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { developmentChains, networkConfig } from "../helper-hardhat-config";
import { verify } from "../utils/verify";

const deployETHPool: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
	const { deployments, getNamedAccounts } = hre;
	const { deploy, log } = deployments;
	const { owner } = await getNamedAccounts();

	const ethPool = await deploy("ETHPool", {
		from: owner,
		log: true,
		waitConfirmations: networkConfig[network.name]?.blockConfirmations || 0,
	});

	log("deployed!");

	if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
		await verify(ethPool.address, []);
	}

	log("--------------");
};
export default deployETHPool;
deployETHPool.tags = ["all"];
