import { run } from "hardhat";

export const verify = async (contractAddress: string, args: any[]) => {
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
