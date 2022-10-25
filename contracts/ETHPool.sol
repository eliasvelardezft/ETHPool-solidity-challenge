// SPDX-License-Identifier: MIT

pragma solidity ^0.8.8;

import "@openzeppelin/contracts/access/AccessControl.sol";

error NotOwner();
error NotTeamMember();
error UnsuccessfulTransfer();
error EmptyPoolReward();

contract ETHPool is AccessControl {
	event Deposit(address indexed sender, uint256 amount);
	event Reward(uint256 amount);
	event Withdrawal(address indexed sender, uint256 amount);

	bytes32 public constant TEAM_MEMBER = keccak256("TEAM_MEMBER");

	constructor() {
		_setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
		_setupRole(TEAM_MEMBER, msg.sender);
	}

	mapping(address => uint256) public addressToAmountFunded;
	mapping(address => uint256) public addressToCorrection;
	uint256 public dividendsPerShare;
	uint256 public magnitude = 1e18;
	uint256 public totalAmount;

	function deposit() public payable {
		totalAmount += msg.value;

		addressToAmountFunded[msg.sender] += msg.value;
		addressToCorrection[msg.sender] += (msg.value * dividendsPerShare) / magnitude;

		emit Deposit(msg.sender, msg.value);
	}

	function reward() public payable onlyTeamMember {
		if (!(totalAmount > 0)) revert EmptyPoolReward();

		dividendsPerShare += (msg.value * magnitude) / totalAmount;
		totalAmount += msg.value;

		emit Reward(msg.value);
	}

	function withdraw() public {
		uint256 correctedWithdrawableAmount = withdrawableAmount(msg.sender);

		(bool success, ) = msg.sender.call{ value: correctedWithdrawableAmount }("");
		if (!success) revert UnsuccessfulTransfer();

		addressToAmountFunded[msg.sender] = 0;
		addressToCorrection[msg.sender] = 0;
		totalAmount -= correctedWithdrawableAmount;

		emit Withdrawal(msg.sender, correctedWithdrawableAmount);
	}

	function withdrawableAmount(address sender) public view returns (uint256) {
		uint256 uncorrectedAmount = (dividendsPerShare * addressToAmountFunded[sender]) / magnitude;
		uint256 correctedAmount = uncorrectedAmount - addressToCorrection[sender];
		return correctedAmount + addressToAmountFunded[sender];
	}

	// modifiers
	modifier onlyTeamMember() {
		if (!(hasRole(TEAM_MEMBER, msg.sender))) revert NotTeamMember();
		_;
	}

	modifier onlyOwner() {
		if (!(hasRole(DEFAULT_ADMIN_ROLE, msg.sender))) revert NotOwner();
		_;
	}

	// administration
	function addTeamMember(address _newTeamMember) public onlyOwner {
		grantRole(TEAM_MEMBER, _newTeamMember);
	}
}
