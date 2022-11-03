// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "@openzeppelin/contracts/access/AccessControl.sol";

error ETHPool__UnsuccessfulTransfer();
error ETHPool__EmptyPoolReward();

contract ETHPool is AccessControl {
	event Deposit(address indexed sender, uint256 amount);
	event Reward(uint256 amount);
	event Withdrawal(address indexed sender, uint256 amount);

	bytes32 public constant TEAM_MEMBER_ROLE = keccak256("TEAM_MEMBER_ROLE");
	mapping(address => uint256) public addressToAmountFunded;
	mapping(address => uint256) public addressToCorrection;
	uint256 public dividendsPerShare;
	uint256 public constant MAGNITUDE = 1e18;
	uint256 public totalAmount;

	constructor() {
		_setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
		_setupRole(TEAM_MEMBER_ROLE, msg.sender);
	}

	function deposit() external payable {
		totalAmount += msg.value;

		addressToAmountFunded[msg.sender] += msg.value;
		addressToCorrection[msg.sender] += (msg.value * dividendsPerShare) / MAGNITUDE;

		emit Deposit(msg.sender, msg.value);
	}

	function reward() external payable onlyRole(TEAM_MEMBER_ROLE) {
		if (!(totalAmount > 0)) revert ETHPool__EmptyPoolReward();

		dividendsPerShare += (msg.value * MAGNITUDE) / totalAmount;
		totalAmount += msg.value;

		emit Reward(msg.value);
	}

	function withdraw() external {
		uint256 correctedWithdrawableAmount = withdrawableAmount(msg.sender);

		// empty sender's amountFunded BEFORE the transfer
		// to avoid reentrancy attack
		// (only with call, with transfer this isn't a problem because of the 2300 gas limit)
		addressToAmountFunded[msg.sender] = 0;
		addressToCorrection[msg.sender] = 0;
		totalAmount -= correctedWithdrawableAmount;

		// (bool success, ) = msg.sender.call{ value: correctedWithdrawableAmount }("");
		// if (!success) revert ETHPool__UnsuccessfulTransfer();
		payable(msg.sender).transfer(correctedWithdrawableAmount);

		emit Withdrawal(msg.sender, correctedWithdrawableAmount);
	}

	function withdrawableAmount(address sender) public view returns (uint256) {
		uint256 uncorrectedPortionOfDividends = (dividendsPerShare *
			addressToAmountFunded[sender]) / MAGNITUDE;
		uint256 correctedPortionOfDividends = uncorrectedPortionOfDividends -
			addressToCorrection[sender];
		return correctedPortionOfDividends + addressToAmountFunded[sender];
	}

	// administration
	function addTeamMember(address _newTeamMember) external {
		grantRole(TEAM_MEMBER_ROLE, _newTeamMember);
	}

	function removeTeamMember(address _teamMember) external {
		revokeRole(TEAM_MEMBER_ROLE, _teamMember);
	}
}
