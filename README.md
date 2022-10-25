

# Sample Hardhat Project
This proyect is the solution to the challenge described below.
## Thought process
While it was easy to think of a simple solution that would work with the presented requirements, that solution used loops and we know loops are to be avoided in solidity because of gas cost.  
Imagine if we needed to loop through each and every pool-funder every time the team wanted to give a reward, it would be very expensive.  
The solution to this problem is to calculate the withdrawable amount when the funder wants to withdraw instead of doing it when the team gives rewards.  
Another problem was that funders should only get a portion of the rewards that were given **after** they deposited, so I had to find a way to calculate a funder's share of the pool taking into consideration the time when they deposited.
To solve this, the contract keeps track of two things:  
1. dividendsPerShare(**DPS**): the proportion between rewards total amount of the pool. If there is 1ETH in the pool and the team gives a reward of 1ETH, now there are 2ETH in the pool and the **DPS** is 1 (1ETH of reward / 1ETH of total amount)
2. correction(address): because the **DPS** is calculated using the totalAmount (reward/totalAmount), the contract needs to prevent the **DPS** from changing when the totalAmount changes because a funder deposits some ETH. This way, the **DPS** only changes when the team deposits some rewards, and not when the funders deposit money.

This two items make the contract calculate the DPS based on the relation between the rewards and the deposits, which means funders will only get a portion of rewards given **after** they deposited.

## Proyect structure
1. contracts folder: contains the ETHPool.sol which is the solution's contract.
2. scripts folder:
   1. deploy.ts: deploys the and verifies the contract.
   2. get-ethpool-total-amount.ts: returns the total amount in the contract's pool
3. test folder: contains a file with the corresponding tests for common cases and both the cases presented in the challenge's github repo.
4. hardhat.config.ts file: contains the hardhat configuration wich allows us to use different networks (or local environments) to interact with the contract as well as configuration for the gas reporter.  

## Link to the verified contract in Etherscan (Goerli)
https://goerli.etherscan.io/address/0x95b83508EEc783F82cFAdd31b5926e991e41bfBF

## Instructions to run the proyect tests locally after cloning
1. ```yarn install```
2. ```yarn hardhat test```  

## IMPORTANT: 
* if you want to run the get-ethpool-total-amount with the actual contract in goerli, you need to create an .env file with the following key:  
```ETHPOOL_CONTRACT_ADDRESS=0x95b83508EEc783F82cFAdd31b5926e991e41bfBF```
* there's a part of the config in hardhat.config.ts that was commented because it needs private env variables to work.  

<br/><br/>
# Smart Contract Challenge

## A) Challenge

### 1) Setup a project and create a contract

#### Summary

ETHPool provides a service where people can deposit ETH and they will receive weekly rewards. Users must be able to take out their deposits along with their portion of rewards at any time. New rewards are deposited manually into the pool by the ETHPool team each week using a contract function.

#### Requirements

- Only the team can deposit rewards.
- Deposited rewards go to the pool of users, not to individual users.
- Users should be able to withdraw their deposits along with their share of rewards considering the time when they deposited.

Example:

> Let say we have user **A** and **B** and team **T**.
>
> **A** deposits 100, and **B** deposits 300 for a total of 400 in the pool. Now **A** has 25% of the pool and **B** has 75%. When **T** deposits 200 rewards, **A** should be able to withdraw 150 and **B** 450.
>
> What if the following happens? **A** deposits then **T** deposits then **B** deposits then **A** withdraws and finally **B** withdraws.
> **A** should get their deposit + all the rewards.
> **B** should only get their deposit because rewards were sent to the pool before they participated.

#### Goal

Design and code a contract for ETHPool, take all the assumptions you need to move forward.

You can use any development tools you prefer: Hardhat, Truffle, Brownie, Solidity, Vyper.

Useful resources:

- Solidity Docs: https://docs.soliditylang.org/en/v0.8.4
- Educational Resource: https://github.com/austintgriffith/scaffold-eth
- Project Starter: https://github.com/abarmat/solidity-starter

### 2) Write tests

Make sure that all your code is tested properly

### 3) Deploy your contract

Deploy the contract to any Ethereum testnet of your preference. Keep record of the deployed address.

Bonus:

- Verify the contract in Etherscan

### 4) Interact with the contract

Create a script (or a Hardhat task) to query the total amount of ETH held in the contract.

_You can use any library you prefer: Ethers.js, Web3.js, Web3.py, eth-brownie_

### 5) Contact
If you want to apply to this position, please share your solution to our Solidity Challenge to the following email: jobs@exactly.finance

