// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./SecurityRegistry.sol";

contract SecurityToken is ERC20, Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    SecurityRegistry public immutable securityRegistry;
    
    struct StakingInfo {
        uint256 amount;
        uint256 timestamp;
        uint256 rewardDebt;
        bool isActive;
    }

    struct RewardPool {
        uint256 totalStaked;
        uint256 rewardRate;
        uint256 lastUpdateTime;
        uint256 rewardPerTokenStored;
    }

    mapping(address => StakingInfo) public stakingInfo;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => bool) public rewardMinters;
    
    RewardPool public rewardPool;
    
    uint256 public constant INITIAL_SUPPLY = 1000000 * 10**18;
    uint256 public constant MAX_SUPPLY = 10000000 * 10**18;
    uint256 public constant STAKE_REWARD_RATE = 100;
    uint256 public constant THREAT_BLOCK_REWARD = 50 * 10**18;
    uint256 public constant REPORT_REWARD = 25 * 10**18;
    uint256 public constant ANALYSIS_REWARD = 10 * 10**18;
    uint256 public constant SCAM_PENALTY = 100 * 10**18;
    
    uint256 public totalBurned;
    bool public stakingEnabled = true;

    event RewardMinted(address indexed user, uint256 amount, string reason);
    event TokensBurned(address indexed user, uint256 amount, string reason);
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event RewardMinterAdded(address indexed minter);
    event RewardMinterRemoved(address indexed minter);

    constructor(address _securityRegistry) ERC20("Security Token", "SEC") {
        require(_securityRegistry != address(0), "Invalid registry address");
        securityRegistry = SecurityRegistry(_securityRegistry);
        
        _mint(msg.sender, INITIAL_SUPPLY);
        rewardMinters[msg.sender] = true;
        
        rewardPool.rewardRate = STAKE_REWARD_RATE;
        rewardPool.lastUpdateTime = block.timestamp;
    }

    modifier onlyRewardMinter() {
        require(rewardMinters[msg.sender], "Not authorized to mint rewards");
        _;
    }

    modifier updateReward(address account) {
        rewardPool.rewardPerTokenStored = rewardPerToken();
        rewardPool.lastUpdateTime = block.timestamp;
        
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPool.rewardPerTokenStored;
        }
        _;
    }

    function rewardSecureUser(address user, uint256 amount, string memory reason) external onlyRewardMinter {
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than 0");
        require(totalSupply().add(amount) <= MAX_SUPPLY, "Would exceed max supply");

        _mint(user, amount);
        emit RewardMinted(user, amount, reason);
    }

    function rewardThreatBlocked(address user) external onlyRewardMinter {
        require(user != address(0), "Invalid user address");
        require(totalSupply().add(THREAT_BLOCK_REWARD) <= MAX_SUPPLY, "Would exceed max supply");

        _mint(user, THREAT_BLOCK_REWARD);
        emit RewardMinted(user, THREAT_BLOCK_REWARD, "Threat blocked");
    }

    function rewardValidReport(address reporter) external onlyRewardMinter {
        require(reporter != address(0), "Invalid reporter address");
        require(totalSupply().add(REPORT_REWARD) <= MAX_SUPPLY, "Would exceed max supply");

        _mint(reporter, REPORT_REWARD);
        emit RewardMinted(reporter, REPORT_REWARD, "Valid scam report");
    }

    function rewardAnalysis(address analyzer) external onlyRewardMinter {
        require(analyzer != address(0), "Invalid analyzer address");
        require(totalSupply().add(ANALYSIS_REWARD) <= MAX_SUPPLY, "Would exceed max supply");

        _mint(analyzer, ANALYSIS_REWARD);
        emit RewardMinted(analyzer, ANALYSIS_REWARD, "Security analysis");
    }

    function penalizeRiskBehavior(address user, uint256 amount, string memory reason) external onlyRewardMinter {
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than 0");
        
        uint256 userBalance = balanceOf(user);
        uint256 burnAmount = amount > userBalance ? userBalance : amount;
        
        if (burnAmount > 0) {
            _burn(user, burnAmount);
            totalBurned = totalBurned.add(burnAmount);
            emit TokensBurned(user, burnAmount, reason);
        }
    }

    function penalizeScamInteraction(address user) external onlyRewardMinter {
        uint256 userBalance = balanceOf(user);
        uint256 burnAmount = SCAM_PENALTY > userBalance ? userBalance : SCAM_PENALTY;
        
        if (burnAmount > 0) {
            _burn(user, burnAmount);
            totalBurned = totalBurned.add(burnAmount);
            emit TokensBurned(user, burnAmount, "Scam interaction");
        }
    }

    function stake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(stakingEnabled, "Staking disabled");
        require(amount > 0, "Cannot stake 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");

        stakingInfo[msg.sender].amount = stakingInfo[msg.sender].amount.add(amount);
        stakingInfo[msg.sender].timestamp = block.timestamp;
        stakingInfo[msg.sender].isActive = true;
        
        rewardPool.totalStaked = rewardPool.totalStaked.add(amount);
        
        _transfer(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant updateReward(msg.sender) {
        require(amount > 0, "Cannot unstake 0");
        require(stakingInfo[msg.sender].amount >= amount, "Insufficient staked amount");

        stakingInfo[msg.sender].amount = stakingInfo[msg.sender].amount.sub(amount);
        rewardPool.totalStaked = rewardPool.totalStaked.sub(amount);
        
        if (stakingInfo[msg.sender].amount == 0) {
            stakingInfo[msg.sender].isActive = false;
        }

        _transfer(address(this), msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    function claimReward() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            require(totalSupply().add(reward) <= MAX_SUPPLY, "Would exceed max supply");
            _mint(msg.sender, reward);
            emit RewardClaimed(msg.sender, reward);
        }
    }

    function rewardPerToken() public view returns (uint256) {
        if (rewardPool.totalStaked == 0) {
            return rewardPool.rewardPerTokenStored;
        }
        
        return rewardPool.rewardPerTokenStored.add(
            block.timestamp.sub(rewardPool.lastUpdateTime)
                .mul(rewardPool.rewardRate)
                .mul(1e18)
                .div(rewardPool.totalStaked)
        );
    }

    function earned(address account) public view returns (uint256) {
        return stakingInfo[account].amount
            .mul(rewardPerToken().sub(userRewardPerTokenPaid[account]))
            .div(1e18)
            .add(rewards[account]);
    }

    function addRewardMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        rewardMinters[minter] = true;
        emit RewardMinterAdded(minter);
    }

    function removeRewardMinter(address minter) external onlyOwner {
        rewardMinters[minter] = false;
        emit RewardMinterRemoved(minter);
    }

    function setStakingEnabled(bool enabled) external onlyOwner {
        stakingEnabled = enabled;
    }

    function setRewardRate(uint256 newRate) external onlyOwner updateReward(address(0)) {
        rewardPool.rewardRate = newRate;
    }

    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function getStakingInfo(address user) external view returns (
        uint256 amount,
        uint256 timestamp,
        uint256 pendingRewards,
        bool isActive
    ) {
        StakingInfo memory info = stakingInfo[user];
        return (
            info.amount,
            info.timestamp,
            earned(user),
            info.isActive
        );
    }

    function getTotalSupplyInfo() external view returns (
        uint256 currentSupply,
        uint256 maxSupply,
        uint256 burned,
        uint256 totalStaked
    ) {
        return (
            totalSupply(),
            MAX_SUPPLY,
            totalBurned,
            rewardPool.totalStaked
        );
    }

    function calculateAPY() external view returns (uint256) {
        if (rewardPool.totalStaked == 0) return 0;
        
        uint256 yearlyRewards = rewardPool.rewardRate.mul(365 days);
        return yearlyRewards.mul(100).div(rewardPool.totalStaked);
    }
}