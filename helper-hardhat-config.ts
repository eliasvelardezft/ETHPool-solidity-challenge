export const developmentChains = ["hardhat", "localhost"];

// localhost
export const LOCALHOST_RPC_URL = process.env.LOCALHOST_RPC_URL;

// goerli
export const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL;
export const GOERLI_CHAINID = parseInt(process.env.GOERLI_CHAINID!, 10);
export const GOERLI_PRIVATE_KEY = process.env.GOERLI_PRIVATE_KEY;

// api keys
export const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
export const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

// network config

interface networkConfigItem {
	blockConfirmations?: number;
	chainId?: number;
}

interface networkConfigInfo {
	[key: string]: networkConfigItem;
}

export const networkConfig: networkConfigInfo = {
	goerli: {
		blockConfirmations: 6,
		chainId: GOERLI_CHAINID,
	},
};
