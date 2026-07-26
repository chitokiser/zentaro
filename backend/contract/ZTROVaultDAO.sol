// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title ZTROVaultDAO
 * @notice A vault contract for ZTRO staking and admin reserve proposals.
 * @dev Inherits OpenZeppelin's Ownable, Pausable, and ReentrancyGuard.
 */
contract ZTROVaultDAO is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable ztro;

    uint256 public totalStaked;
    uint256 public adminReserve;
    uint256 public totalReservedProposalAmount;

    uint256 public votingPeriod = 7 days;
    uint256 public stakeCounter;
    uint256 public proposalCounter;

    mapping(address => bool) public withdrawApproved;
    mapping(address => bool) public transferApproved;

    struct StakeInfo {
        uint256 stakeId;
        uint256 amount;
        uint256 lockedUntil;
        uint256 createdAt;
        bool active;
        bool unstaked;
        bool transferred;
    }

    struct Proposal {
        uint256 proposalId;
        address recipient;
        uint256 amount;
        uint256 createdAt;
        uint256 deadline;
        bool executed;
        bool cancelled;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 snapshotTotalStake;
    }

    mapping(uint256 => StakeInfo) public stakes;
    mapping(address => uint256[]) public userStakeIds;
    mapping(address => mapping(uint256 => bool)) public stakeExists;
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => bool)) public voteChoice;
    mapping(address => uint256) public stakingPower;
    
    address[] public stakers;
    mapping(address => uint256) public stakerIndex;
    mapping(uint256 => mapping(address => uint256)) public snapshotPower;

    event Stake(address indexed user, uint256 indexed stakeId, uint256 amount, uint256 lockDays);
    event Unstake(address indexed user, uint256 indexed stakeId, uint256 amount);
    event TransferCompleted(address indexed user, uint256 indexed stakeId, uint256 amount, address recipient);
    event WithdrawApprovalChanged(address indexed admin, address indexed user, bool approved, uint256 timestamp);
    event TransferApprovalChanged(address indexed admin, address indexed user, bool approved, uint256 timestamp);
    event ProposalCreated(uint256 indexed proposalId, address recipient, uint256 amount, uint256 deadline);
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 votingPower);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    event AdminReserveChanged(uint256 previousReserve, uint256 newReserve);
    event AdminReserveDeposited(uint256 amount);
    event AdminReserveWithdrawn(uint256 amount);
    event ProposalReserved(uint256 proposalId, uint256 amount);

    constructor(address _ztro) Ownable(msg.sender) {
        require(_ztro != address(0), "ZTRO zero address");
        ztro = IERC20(_ztro);
    }

    /// @notice Stake ZTRO tokens for a lock period (30, 90, 180, 365, or 1095 days).
    /// @param amount Amount of ZTRO to stake.
    /// @param lockDays Lock duration in days.
    function stake(uint256 amount, uint256 lockDays)
        external
        whenNotPaused
        nonReentrant
        returns (uint256 stakeId)
    {
        require(amount > 0, "amount > 0");
        require(
            lockDays % 30 == 0 && lockDays >= 30 && lockDays <= 1095,
            "invalid lock period"
        );

        ztro.safeTransferFrom(msg.sender, address(this), amount);

        stakeId = ++stakeCounter;
        uint256 lockedUntil = block.timestamp + (lockDays * 1 days);

        stakes[stakeId] = StakeInfo({
            stakeId: stakeId,
            amount: amount,
            lockedUntil: lockedUntil,
            createdAt: block.timestamp,
            active: true,
            unstaked: false,
            transferred: false
        });

        userStakeIds[msg.sender].push(stakeId);
        stakeExists[msg.sender][stakeId] = true;

        uint256 prevPower = stakingPower[msg.sender];
        stakingPower[msg.sender] = prevPower + amount;
        totalStaked += amount;

        if (prevPower == 0) {
            stakerIndex[msg.sender] = stakers.length;
            stakers.push(msg.sender);
        }

        emit Stake(msg.sender, stakeId, amount, lockDays);
        return stakeId;
    }

    /// @notice Unstake after lock period ends. Requires withdrawal approval.
    /// @param stakeId ID of the stake to unstake.
    function unstake(uint256 stakeId) external whenNotPaused nonReentrant {
        require(stakeExists[msg.sender][stakeId], "not owner");
        StakeInfo storage s = stakes[stakeId];
        require(s.active, "not active");
        require(block.timestamp >= s.lockedUntil, "still locked");
        require(withdrawApproved[msg.sender], "withdraw not approved");

        s.active = false;
        s.unstaked = true;
        stakingPower[msg.sender] -= s.amount;
        totalStaked -= s.amount;

        if (stakingPower[msg.sender] == 0) {
            _removeStaker(msg.sender);
        }

        emit Unstake(msg.sender, stakeId, s.amount);
    }

    /// @notice Transfer out tokens to recipient after unstake. Requires transfer approval.
    /// @param stakeId ID of the stake to transfer.
    /// @param recipient Address receiving the tokens.
    function transferOut(uint256 stakeId, address recipient) external whenNotPaused nonReentrant {
        require(stakeExists[msg.sender][stakeId], "not owner");
        StakeInfo storage s = stakes[stakeId];
        require(!s.active, "stake still active");
        require(s.unstaked, "not unstaked");
        require(!s.transferred, "already transferred");
        require(transferApproved[msg.sender], "transfer not approved");
        require(recipient != address(0), "recipient zero");

        s.transferred = true;

        // Auto reset approvals
        withdrawApproved[msg.sender] = false;
        transferApproved[msg.sender] = false;
        emit WithdrawApprovalChanged(address(0), msg.sender, false, block.timestamp);
        emit TransferApprovalChanged(address(0), msg.sender, false, block.timestamp);

        ztro.safeTransfer(recipient, s.amount);

        emit TransferCompleted(msg.sender, stakeId, s.amount, recipient);
    }

    /// @notice Internal helper to remove a staker from the active list.
    /// @param user Address of the staker to remove.
    function _removeStaker(address user) internal {
        uint256 index = stakerIndex[user];
        uint256 lastIndex = stakers.length - 1;
        if (index != lastIndex) {
            address lastUser = stakers[lastIndex];
            stakers[index] = lastUser;
            stakerIndex[lastUser] = index;
        }
        stakers.pop();
        delete stakerIndex[user];
    }

    /// @notice Owner can set withdrawal approval per user.
    function setWithdrawApproval(address user, bool approved) external onlyOwner {
        require(user != address(0), "user zero");
        withdrawApproved[user] = approved;
        emit WithdrawApprovalChanged(msg.sender, user, approved, block.timestamp);
    }

    /// @notice Owner can set transfer approval per user.
    function setTransferApproval(address user, bool approved) external onlyOwner {
        require(user != address(0), "user zero");
        transferApproved[user] = approved;
        emit TransferApprovalChanged(msg.sender, user, approved, block.timestamp);
    }

    /// @notice Deposit tokens into the admin reserve.
    function depositAdminReserve(uint256 amount) external onlyOwner whenNotPaused nonReentrant {
        require(amount > 0, "amount > 0");
        uint256 prev = adminReserve;
        ztro.safeTransferFrom(msg.sender, address(this), amount);
        adminReserve = prev + amount;
        emit AdminReserveChanged(prev, adminReserve);
        emit AdminReserveDeposited(amount);
    }

    /// @notice Withdraw free admin reserve directly.
    /// @param amount Amount to withdraw.
    function withdrawAdminReserve(uint256 amount) external onlyOwner nonReentrant {
        require(amount > 0, "amount > 0");
        require(amount <= adminReserve - totalReservedProposalAmount, "insufficient free reserve");
        uint256 prev = adminReserve;
        adminReserve = prev - amount;
        ztro.safeTransfer(msg.sender, amount);
        emit AdminReserveChanged(prev, adminReserve);
        emit AdminReserveWithdrawn(amount);
    }

    /// @notice Create DAO proposal to withdraw from reserve.
    /// @param recipient Address to receive proposed funds on execution.
    /// @param amount Amount of reserve to propose.
    function createProposal(address recipient, uint256 amount)
        external
        onlyOwner
        whenNotPaused
        returns (uint256 proposalId)
    {
        require(recipient != address(0), "recipient zero");
        require(amount > 0, "amount > 0");
        require(totalReservedProposalAmount + amount <= adminReserve, "insufficient reserve");

        proposalId = ++proposalCounter;
        totalReservedProposalAmount += amount;

        proposals[proposalId] = Proposal({
            proposalId: proposalId,
            recipient: recipient,
            amount: amount,
            createdAt: block.timestamp,
            deadline: block.timestamp + votingPeriod,
            executed: false,
            cancelled: false,
            yesVotes: 0,
            noVotes: 0,
            snapshotTotalStake: totalStaked
        });

        uint256 len = stakers.length;
        for (uint256 i = 0; i < len; i++) {
            address voter = stakers[i];
            snapshotPower[proposalId][voter] = stakingPower[voter];
        }

        emit ProposalCreated(proposalId, recipient, amount, proposals[proposalId].deadline);
        emit ProposalReserved(proposalId, amount);
        return proposalId;
    }

    /// @notice Vote on a proposal using snapshot voting power.
    /// @param proposalId ID of the proposal to vote on.
    /// @param support True for yes, false for no.
    function vote(uint256 proposalId, bool support) external whenNotPaused nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(p.proposalId != 0, "proposal not found");
        require(!p.executed, "already executed");
        require(!p.cancelled, "cancelled");
        require(block.timestamp <= p.deadline, "voting ended");
        require(!hasVoted[proposalId][msg.sender], "already voted");

        uint256 votingPower_ = snapshotPower[proposalId][msg.sender];
        require(votingPower_ > 0, "no voting power");

        hasVoted[proposalId][msg.sender] = true;
        voteChoice[proposalId][msg.sender] = support;

        if (support) {
            p.yesVotes += votingPower_;
        } else {
            p.noVotes += votingPower_;
        }

        emit VoteCast(proposalId, msg.sender, support, votingPower_);
    }

    /// @notice Execute approved proposal after voting period ends.
    /// @param proposalId ID of the proposal to execute.
    function executeProposal(uint256 proposalId) external onlyOwner nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(p.proposalId != 0, "proposal not found");
        require(!p.executed, "already executed");
        require(!p.cancelled, "cancelled");
        require(block.timestamp > p.deadline, "voting not ended");
        require(p.yesVotes >= (p.snapshotTotalStake * 80) / 100, "proposal not passed");
        require(p.amount <= adminReserve, "insufficient reserve");

        uint256 prevReserve = adminReserve;
        p.executed = true;
        adminReserve -= p.amount;
        totalReservedProposalAmount -= p.amount;

        ztro.safeTransfer(p.recipient, p.amount);

        emit AdminReserveChanged(prevReserve, adminReserve);
        emit ProposalExecuted(proposalId);
    }

    /// @notice Cancel proposal before execution.
    /// @param proposalId ID of the proposal to cancel.
    function cancelProposal(uint256 proposalId) external onlyOwner {
        Proposal storage p = proposals[proposalId];
        require(p.proposalId != 0, "proposal not found");
        require(!p.executed, "already executed");
        require(!p.cancelled, "cancelled");

        p.cancelled = true;
        totalReservedProposalAmount -= p.amount;

        emit ProposalCancelled(proposalId);
    }

    /// @notice Set voting period.
    /// @param newPeriod New voting period duration in seconds.
    function setVotingPeriod(uint256 newPeriod) external onlyOwner {
        require(newPeriod > 0, "period > 0");
        votingPeriod = newPeriod;
    }

    /// @notice Pause contract.
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpause contract.
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Emergency token recover. ZTRO is excluded.
    function emergencyRecover(address tokenAddress, address recipient, uint256 amount) external onlyOwner {
        require(tokenAddress != address(0), "token zero");
        require(tokenAddress != address(ztro), "ZTRO cannot be recovered");
        require(recipient != address(0), "recipient zero");
        IERC20(tokenAddress).safeTransfer(recipient, amount);
    }

    /// @notice Get stake details.
    function getStake(uint256 stakeId) external view returns (StakeInfo memory) {
        return stakes[stakeId];
    }

    /// @notice Get all stake IDs for a user.
    function getAllStakes(address user) external view returns (uint256[] memory) {
        return userStakeIds[user];
    }

    /// @notice Get proposal details.
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }

    /// @notice Get proposal votes.
    function getProposalVotes(uint256 proposalId) external view returns (uint256 yesVotes_, uint256 noVotes_) {
        Proposal storage p = proposals[proposalId];
        return (p.yesVotes, p.noVotes);
    }

    /// @notice Total staked amount.
    function getTotalStaked() external view returns (uint256) {
        return totalStaked;
    }

    /// @notice Reserve balance.
    function getReserveBalance() external view returns (uint256) {
        return adminReserve;
    }

    /// @notice Withdrawal approval status per user.
    function isWithdrawApproved(address user) external view returns (bool) {
        return withdrawApproved[user];
    }

    /// @notice Transfer approval status per user.
    function isTransferApproved(address user) external view returns (bool) {
        return transferApproved[user];
    }

    /// @notice Stake status.
    function getStakeStatus(uint256 stakeId) external view returns (bool active, bool unstaked, bool transferred) {
        StakeInfo storage s = stakes[stakeId];
        return (s.active, s.unstaked, s.transferred);
    }

    /// @notice Proposal result summary.
    function getProposalResult(uint256 proposalId)
        external
        view
        returns (uint256 yesVotes_, uint256 noVotes_, bool passed_, bool executed_, bool cancelled_)
    {
        Proposal storage p = proposals[proposalId];
        return (p.yesVotes, p.noVotes, p.yesVotes >= (p.snapshotTotalStake * 80) / 100, p.executed, p.cancelled);
    }

    /// @notice Snapshot power for a voter.
    function getSnapshotPower(uint256 proposalId, address user) external view returns (uint256) {
        return snapshotPower[proposalId][user];
    }

    /// @notice Check if proposal passed.
    function proposalPassed(uint256 proposalId) external view returns (bool) {
        Proposal storage p = proposals[proposalId];
        if (p.proposalId == 0 || p.cancelled || p.executed) return false;
        return p.yesVotes >= (p.snapshotTotalStake * 80) / 100;
    }
}
