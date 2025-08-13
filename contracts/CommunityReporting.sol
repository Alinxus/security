// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./SecurityRegistry.sol";
import "./SecurityToken.sol";

contract CommunityReporting is ReentrancyGuard, Ownable {
    using SafeMath for uint256;

    SecurityRegistry public immutable securityRegistry;
    SecurityToken public immutable securityToken;

    struct Report {
        uint256 id;
        address reporter;
        address target;
        string category;
        string description;
        string evidence;
        uint256 stake;
        uint256 timestamp;
        ReportStatus status;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 rewardAmount;
        mapping(address => bool) hasVoted;
        mapping(address => uint256) voterStakes;
    }

    struct Reporter {
        uint256 totalReports;
        uint256 successfulReports;
        uint256 reputation;
        uint256 totalStaked;
        bool isBanned;
    }

    enum ReportStatus {
        Pending,
        UnderReview,
        Verified,
        Rejected,
        Disputed
    }

    mapping(uint256 => Report) public reports;
    mapping(address => Reporter) public reporters;
    mapping(address => uint256[]) public userReports;
    mapping(bytes32 => bool) public reportExists;

    uint256 public reportCounter;
    uint256 public constant MIN_STAKE = 100 * 10**18;
    uint256 public constant MIN_VOTING_STAKE = 50 * 10**18;
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant REVIEW_PERIOD = 3 days;
    uint256 public constant SUCCESS_REWARD_MULTIPLIER = 150;
    uint256 public constant VOTER_REWARD_SHARE = 20;

    event ReportSubmitted(uint256 indexed reportId, address indexed reporter, address indexed target, string category);
    event ReportStatusChanged(uint256 indexed reportId, ReportStatus oldStatus, ReportStatus newStatus);
    event VoteCast(uint256 indexed reportId, address indexed voter, bool support, uint256 stake);
    event ReportVerified(uint256 indexed reportId, address indexed target);
    event RewardDistributed(uint256 indexed reportId, address indexed recipient, uint256 amount);
    event ReporterBanned(address indexed reporter, string reason);

    constructor(address _securityRegistry, address _securityToken) {
        require(_securityRegistry != address(0), "Invalid registry address");
        require(_securityToken != address(0), "Invalid token address");
        
        securityRegistry = SecurityRegistry(_securityRegistry);
        securityToken = SecurityToken(_securityToken);
    }

    function submitReport(
        address target,
        string memory category,
        string memory description,
        string memory evidence,
        uint256 stake
    ) external nonReentrant returns (uint256) {
        require(target != address(0), "Invalid target address");
        require(target != msg.sender, "Cannot report yourself");
        require(bytes(category).length > 0, "Category required");
        require(bytes(description).length > 0, "Description required");
        require(stake >= MIN_STAKE, "Insufficient stake");
        require(!reporters[msg.sender].isBanned, "Reporter is banned");

        bytes32 reportHash = keccak256(abi.encodePacked(msg.sender, target, category, description));
        require(!reportExists[reportHash], "Duplicate report");

        require(securityToken.transferFrom(msg.sender, address(this), stake), "Stake transfer failed");

        uint256 reportId = ++reportCounter;
        Report storage report = reports[reportId];
        
        report.id = reportId;
        report.reporter = msg.sender;
        report.target = target;
        report.category = category;
        report.description = description;
        report.evidence = evidence;
        report.stake = stake;
        report.timestamp = block.timestamp;
        report.status = ReportStatus.Pending;

        reportExists[reportHash] = true;
        userReports[msg.sender].push(reportId);
        
        reporters[msg.sender].totalReports++;
        reporters[msg.sender].totalStaked = reporters[msg.sender].totalStaked.add(stake);

        emit ReportSubmitted(reportId, msg.sender, target, category);
        
        return reportId;
    }

    function voteOnReport(uint256 reportId, bool support, uint256 stake) external nonReentrant {
        Report storage report = reports[reportId];
        require(report.id != 0, "Report does not exist");
        require(report.status == ReportStatus.UnderReview, "Report not under review");
        require(!report.hasVoted[msg.sender], "Already voted");
        require(stake >= MIN_VOTING_STAKE, "Insufficient voting stake");
        require(block.timestamp <= report.timestamp.add(VOTING_PERIOD), "Voting period ended");

        require(securityToken.transferFrom(msg.sender, address(this), stake), "Stake transfer failed");

        report.hasVoted[msg.sender] = true;
        report.voterStakes[msg.sender] = stake;

        if (support) {
            report.votesFor = report.votesFor.add(stake);
        } else {
            report.votesAgainst = report.votesAgainst.add(stake);
        }

        emit VoteCast(reportId, msg.sender, support, stake);
    }

    function reviewReport(uint256 reportId) external onlyOwner {
        Report storage report = reports[reportId];
        require(report.id != 0, "Report does not exist");
        require(report.status == ReportStatus.Pending, "Report already reviewed");

        ReportStatus oldStatus = report.status;
        report.status = ReportStatus.UnderReview;
        
        emit ReportStatusChanged(reportId, oldStatus, ReportStatus.UnderReview);
    }

    function finalizeReport(uint256 reportId) external nonReentrant {
        Report storage report = reports[reportId];
        require(report.id != 0, "Report does not exist");
        require(report.status == ReportStatus.UnderReview, "Report not under review");
        require(block.timestamp > report.timestamp.add(VOTING_PERIOD), "Voting period not ended");

        ReportStatus oldStatus = report.status;
        bool isVerified = report.votesFor > report.votesAgainst;

        if (isVerified) {
            report.status = ReportStatus.Verified;
            
            securityRegistry.reportScamAddress(
                report.target,
                report.category,
                report.evidence
            );

            _distributeRewards(reportId);
            
            reporters[report.reporter].successfulReports++;
            reporters[report.reporter].reputation = reporters[report.reporter].reputation.add(10);

            emit ReportVerified(reportId, report.target);
        } else {
            report.status = ReportStatus.Rejected;
            
            securityToken.transfer(report.reporter, report.stake.div(2));
        }

        emit ReportStatusChanged(reportId, oldStatus, report.status);
    }

    function _distributeRewards(uint256 reportId) internal {
        Report storage report = reports[reportId];
        
        uint256 reporterReward = report.stake.mul(SUCCESS_REWARD_MULTIPLIER).div(100);
        report.rewardAmount = reporterReward;
        
        securityToken.rewardValidReport(report.reporter);
        securityToken.transfer(report.reporter, reporterReward);
        
        emit RewardDistributed(reportId, report.reporter, reporterReward);

        uint256 totalVoterRewards = report.stake.mul(VOTER_REWARD_SHARE).div(100);
        if (report.votesFor > 0) {
            _distributeVoterRewards(reportId, totalVoterRewards);
        }
    }

    function _distributeVoterRewards(uint256 reportId, uint256 totalRewards) internal {
        Report storage report = reports[reportId];
        
        for (uint256 i = 0; i < userReports[report.reporter].length; i++) {
            uint256 currentReportId = userReports[report.reporter][i];
            if (currentReportId == reportId) continue;
            
            Report storage currentReport = reports[currentReportId];
            if (currentReport.hasVoted[msg.sender] && currentReport.votesFor > 0) {
                uint256 voterShare = currentReport.voterStakes[msg.sender].mul(totalRewards).div(report.votesFor);
                if (voterShare > 0) {
                    securityToken.transfer(msg.sender, voterShare);
                    emit RewardDistributed(reportId, msg.sender, voterShare);
                }
            }
        }
    }

    function disputeReport(uint256 reportId, string memory reason) external onlyOwner {
        Report storage report = reports[reportId];
        require(report.id != 0, "Report does not exist");
        require(report.status == ReportStatus.Verified || report.status == ReportStatus.Rejected, "Cannot dispute");

        ReportStatus oldStatus = report.status;
        report.status = ReportStatus.Disputed;
        
        emit ReportStatusChanged(reportId, oldStatus, ReportStatus.Disputed);
    }

    function banReporter(address reporter, string memory reason) external onlyOwner {
        require(reporter != address(0), "Invalid reporter address");
        reporters[reporter].isBanned = true;
        emit ReporterBanned(reporter, reason);
    }

    function unbanReporter(address reporter) external onlyOwner {
        require(reporter != address(0), "Invalid reporter address");
        reporters[reporter].isBanned = false;
    }

    function emergencyWithdrawStake(uint256 reportId) external nonReentrant {
        Report storage report = reports[reportId];
        require(report.reporter == msg.sender, "Not the reporter");
        require(report.status == ReportStatus.Disputed, "Report not disputed");
        require(block.timestamp > report.timestamp.add(30 days), "Too early for emergency withdrawal");

        uint256 refundAmount = report.stake.div(2);
        securityToken.transfer(msg.sender, refundAmount);
    }

    function getReport(uint256 reportId) external view returns (
        address reporter,
        address target,
        string memory category,
        string memory description,
        string memory evidence,
        uint256 stake,
        uint256 timestamp,
        ReportStatus status,
        uint256 votesFor,
        uint256 votesAgainst
    ) {
        Report storage report = reports[reportId];
        return (
            report.reporter,
            report.target,
            report.category,
            report.description,
            report.evidence,
            report.stake,
            report.timestamp,
            report.status,
            report.votesFor,
            report.votesAgainst
        );
    }

    function getReporterStats(address reporter) external view returns (
        uint256 totalReports,
        uint256 successfulReports,
        uint256 reputation,
        uint256 totalStaked,
        bool isBanned,
        uint256 successRate
    ) {
        Reporter storage rep = reporters[reporter];
        uint256 successRate = rep.totalReports > 0 ? rep.successfulReports.mul(100).div(rep.totalReports) : 0;
        
        return (
            rep.totalReports,
            rep.successfulReports,
            rep.reputation,
            rep.totalStaked,
            rep.isBanned,
            successRate
        );
    }

    function getUserReports(address user) external view returns (uint256[] memory) {
        return userReports[user];
    }

    function getActiveReports() external view returns (uint256[] memory) {
        uint256[] memory activeReports = new uint256[](reportCounter);
        uint256 count = 0;
        
        for (uint256 i = 1; i <= reportCounter; i++) {
            if (reports[i].status == ReportStatus.Pending || reports[i].status == ReportStatus.UnderReview) {
                activeReports[count] = i;
                count++;
            }
        }
        
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeReports[i];
        }
        
        return result;
    }
}