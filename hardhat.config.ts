import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-deploy";
import {
	GOERLI_CHAINID,
	GOERLI_RPC_URL,
	GOERLI_PRIVATE_KEY,
	LOCALHOST_RPC_URL,
	ETHERSCAN_API_KEY,
	COINMARKETCAP_API_KEY,
} from "./helper-hardhat-config";

const config: HardhatUserConfig = {
	defaultNetwork: "hardhat",
	solidity: "0.8.17",
	networks: {
		goerli: {
			url: GOERLI_RPC_URL,
			accounts: [GOERLI_PRIVATE_KEY!],
			chainId: +GOERLI_CHAINID!,
		},
		localhost: {
			url: LOCALHOST_RPC_URL,
		},
	},
	etherscan: {
		apiKey: ETHERSCAN_API_KEY,
	},
	gasReporter: {
		enabled: false,
		outputFile: "gas-report.txt",
		noColors: true,
		currency: "USD",
		coinmarketcap: COINMARKETCAP_API_KEY,
	},
	namedAccounts: {
		owner: 0,
		teamMember: 1,
		funder1: 2,
		funder2: 3,
	},
};

export default config;
