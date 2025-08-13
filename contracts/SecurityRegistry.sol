// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract SecurityRegistry is Ownable, ReentrancyGuard {
    using SafeMath for uint256;

    struct SecurityData {
        uint256 riskScore;
        bool isBlacklisted;
        uint256 lastUpdated;
        uint256 reportCount;
        string[] riskFactors;
    }

    struct UserProfile {
        uint256 reputationScore;
        uint256 transactionsAnalyzed;
        uint256 threatsBlocked;
        uint256 correctReports;
        bool isVerifiedAnalyst;
    }

    mapping(address => SecurityData) public securityData;
    mapping(address => UserProfile) public userProfiles;
    mapping(address => bool) public authorizedAnalyzers;
    
    address[] public blacklistedAddresses;
    address[] public watchlistAddresses;

    uint256 public constant MAX_RISK_SCORE = 100;
    uint256 public constant BLACKLIST_THRESHOLD = 75;
    uint256 public constant REPUTATION_DECAY_RATE = 1;

    event SecurityScoreUpdated(address indexed target, uint256 oldScore, uint256 newScore, address indexed analyzer);
    event AddressBlacklisted(address indexed target, string reason);
    event AddressWhitelisted(address indexed target);
    event ReportSubmitted(address indexed reporter, address indexed target, string reason);
    event AnalyzerAuthorized(address indexed analyzer);
    event AnalyzerRevoked(address indexed analyzer);

    constructor() {
        authorizedAnalyzers[msg.sender] = true;
        userProfiles[msg.sender].isVerifiedAnalyst = true;
    }

    modifier onlyAuthorizedAnalyzer() {
        require(authorizedAnalyzers[msg.sender], "Not authorized analyzer");
        _;
    }

    function updateSecurityScore(
        address target,
        uint256 riskScore,
        string[] memory riskFactors
    ) external onlyAuthorizedAnalyzer {
        require(target != address(0), "Invalid target address");
        require(riskScore <= MAX_RISK_SCORE, "Risk score too high");

        uint256 oldScore = securityData[target].riskScore;
        
        securityData[target].riskScore = riskScore;
        securityData[target].lastUpdated = block.timestamp;
        securityData[target].riskFactors = riskFactors;

        if (riskScore >= BLACKLIST_THRESHOLD && !securityData[target].isBlacklisted) {
            securityData[target].isBlacklisted = true;
            blacklistedAddresses.push(target);
            emit AddressBlacklisted(target, "High risk score");
        }

        userProfiles[msg.sender].transactionsAnalyzed++;
        
        emit SecurityScoreUpdated(target, oldScore, riskScore, msg.sender);
    }

    function reportScamAddress(
        address target,
        string memory reason,
        string memory evidence
    ) external {
        require(target != address(0), "Invalid target address");
        require(bytes(reason).length > 0, "Reason required");

        securityData[target].reportCount++;
        
        if (securityData[target].reportCount >= 3) {
            securityData[target].isBlacklisted = true;
            if (!isBlacklisted(target)) {
                blacklistedAddresses.push(target);
            }
            emit AddressBlacklisted(target, "Multiple reports");
        }

        userProfiles[msg.sender].correctReports++;
        
        emit ReportSubmitted(msg.sender, target, reason);
    }

    function blacklistAddress(address target, string memory reason) external onlyOwner {
        require(target != address(0), "Invalid target address");
        
        if (!securityData[target].isBlacklisted) {
            securityData[target].isBlacklisted = true;
            blacklistedAddresses.push(target);
            emit AddressBlacklisted(target, reason);
        }
    }

    function whitelistAddress(address target) external onlyOwner {
        require(target != address(0), "Invalid target address");
        
        securityData[target].isBlacklisted = false;
        securityData[target].riskScore = 0;
        
        emit AddressWhitelisted(target);
    }

    function authorizeAnalyzer(address analyzer) external onlyOwner {
        require(analyzer != address(0), "Invalid analyzer address");
        authorizedAnalyzers[analyzer] = true;
        userProfiles[analyzer].isVerifiedAnalyst = true;
        emit AnalyzerAuthorized(analyzer);
    }

    function revokeAnalyzer(address analyzer) external onlyOwner {
        require(analyzer != address(0), "Invalid analyzer address");
        authorizedAnalyzers[analyzer] = false;
        userProfiles[analyzer].isVerifiedAnalyst = false;
        emit AnalyzerRevoked(analyzer);
    }

    function updateUserReputation(address user, uint256 delta, bool increase) external onlyAuthorizedAnalyzer {
        if (increase) {
            userProfiles[user].reputationScore = userProfiles[user].reputationScore.add(delta);
        } else {
            if (userProfiles[user].reputationScore >= delta) {
                userProfiles[user].reputationScore = userProfiles[user].reputationScore.sub(delta);
            } else {
                userProfiles[user].reputationScore = 0;
            }
        }
    }

    function recordThreatBlocked(address user) external onlyAuthorizedAnalyzer {
        userProfiles[user].threatsBlocked++;
        userProfiles[user].reputationScore = userProfiles[user].reputationScore.add(10);
    }

    function getSecurityData(address target) external view returns (
        uint256 riskScore,
        bool isBlacklisted,
        uint256 lastUpdated,
        uint256 reportCount,
        string[] memory riskFactors
    ) {
        SecurityData memory data = securityData[target];
        return (
            data.riskScore,
            data.isBlacklisted,
            data.lastUpdated,
            data.reportCount,
            data.riskFactors
        );
    }

    function getUserProfile(address user) external view returns (
        uint256 reputationScore,
        uint256 transactionsAnalyzed,
        uint256 threatsBlocked,
        uint256 correctReports,
        bool isVerifiedAnalyst
    ) {
        UserProfile memory profile = userProfiles[user];
        return (
            profile.reputationScore,
            profile.transactionsAnalyzed,
            profile.threatsBlocked,
            profile.correctReports,
            profile.isVerifiedAnalyst
        );
    }

    function isBlacklisted(address target) public view returns (bool) {
        return securityData[target].isBlacklisted;
    }

    function getRiskScore(address target) external view returns (uint256) {
        return securityData[target].riskScore;
    }

    function isHighRisk(address target) external view returns (bool) {
        return securityData[target].riskScore >= BLACKLIST_THRESHOLD;
    }

    function getBlacklistedAddresses() external view returns (address[] memory) {
        return blacklistedAddresses;
    }

    function getBlacklistedCount() external view returns (uint256) {
        return blacklistedAddresses.length;
    }

    function isAuthorizedAnalyzer(address analyzer) external view returns (bool) {
        return authorizedAnalyzers[analyzer];
    }
}