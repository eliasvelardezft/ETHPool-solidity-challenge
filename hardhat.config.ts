import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-gas-reporter";
import "solidity-coverage";

const LOCALHOST_RPC_URL = process.env.LOCALHOST_RPC_URL;
const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL;
const GOERLI_CHAINID = parseInt(process.env.GOERLI_CHAINID!, 10);
const GOERLI_PRIVATE_KEY = process.env.GOERLI_PRIVATE_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

const config: HardhatUserConfig = {
	defaultNetwork: "hardhat",
	solidity: "0.8.17",
	// networks: {
	// 	goerli: {
	// 		url: GOERLI_RPC_URL,
	// 		accounts: [GOERLI_PRIVATE_KEY!],
	// 		chainId: GOERLI_CHAINID,
	// 	},
	// 	localhost: {
	// 		url: LOCALHOST_RPC_URL,
	// 	},
	// },
	// etherscan: {
	// 	apiKey: ETHERSCAN_API_KEY,
	// },
	// gasReporter: {
	// 	enabled: false,
	// 	outputFile: "gas-report.txt",
	// 	noColors: true,
	// 	currency: "USD",
	// 	coinmarketcap: COINMARKETCAP_API_KEY,
	// },
};

export default config;
