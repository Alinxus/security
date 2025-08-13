// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./SecurityRegistry.sol";

contract TransactionFirewall is ReentrancyGuard, Ownable {
    using SafeMath for uint256;

    SecurityRegistry public immutable securityRegistry;
    
    struct TransactionData {
        address target;
        bytes data;
        uint256 value;
        uint256 timestamp;
        bool executed;
        uint256 riskScore;
    }

    mapping(bytes32 => TransactionData) public pendingTransactions;
    mapping(address => uint256) public userNonces;
    mapping(address => bool) public emergencyBlocked;
    
    uint256 public constant HIGH_RISK_THRESHOLD = 50;
    uint256 public constant CRITICAL_RISK_THRESHOLD = 75;
    uint256 public constant QUARANTINE_PERIOD = 24 hours;
    
    bool public emergencyMode = false;
    bool public bypassMode = false;

    event TransactionQueued(bytes32 indexed txId, address indexed user, address indexed target, uint256 riskScore);
    event TransactionExecuted(bytes32 indexed txId, address indexed user, bool success);
    event TransactionBlocked(bytes32 indexed txId, address indexed user, address indexed target, uint256 riskScore, string reason);
    event EmergencyModeToggled(bool enabled);
    event UserEmergencyBlocked(address indexed user, string reason);
    event RiskThresholdUpdated(uint256 oldThreshold, uint256 newThreshold);

    constructor(address _securityRegistry) {
        require(_securityRegistry != address(0), "Invalid registry address");
        securityRegistry = SecurityRegistry(_securityRegistry);
    }

    modifier notEmergencyBlocked() {
        require(!emergencyBlocked[msg.sender], "User emergency blocked");
        _;
    }

    modifier notInEmergencyMode() {
        require(!emergencyMode, "Emergency mode active");
        _;
    }

    function safeExecute(
        address target,
        bytes calldata data,
        uint256 value
    ) external payable nonReentrant notEmergencyBlocked notInEmergencyMode returns (bytes32) {
        require(target != address(0), "Invalid target address");
        require(msg.value >= value, "Insufficient ETH sent");

        uint256 riskScore = securityRegistry.getRiskScore(target);
        bool isBlacklisted = securityRegistry.isBlacklisted(target);
        
        bytes32 txId = keccak256(abi.encodePacked(
            msg.sender,
            target,
            data,
            value,
            userNonces[msg.sender]++,
            block.timestamp
        ));

        pendingTransactions[txId] = TransactionData({
            target: target,
            data: data,
            value: value,
            timestamp: block.timestamp,
            executed: false,
            riskScore: riskScore
        });

        if (isBlacklisted) {
            emit TransactionBlocked(txId, msg.sender, target, riskScore, "Target blacklisted");
            if (msg.value > 0) {
                payable(msg.sender).transfer(msg.value);
            }
            return txId;
        }

        if (riskScore >= CRITICAL_RISK_THRESHOLD) {
            emit TransactionBlocked(txId, msg.sender, target, riskScore, "Critical risk level");
            if (msg.value > 0) {
                payable(msg.sender).transfer(msg.value);
            }
            securityRegistry.recordThreatBlocked(msg.sender);
            return txId;
        }

        if (riskScore >= HIGH_RISK_THRESHOLD) {
            emit TransactionQueued(txId, msg.sender, target, riskScore);
            return txId;
        }

        return _executeTransaction(txId);
    }

    function executeQueuedTransaction(bytes32 txId) external nonReentrant {
        TransactionData storage txData = pendingTransactions[txId];
        require(txData.timestamp > 0, "Transaction not found");
        require(!txData.executed, "Transaction already executed");
        require(block.timestamp >= txData.timestamp.add(QUARANTINE_PERIOD), "Quarantine period not over");

        uint256 currentRiskScore = securityRegistry.getRiskScore(txData.target);
        bool isBlacklisted = securityRegistry.isBlacklisted(txData.target);

        if (isBlacklisted || currentRiskScore >= CRITICAL_RISK_THRESHOLD) {
            emit TransactionBlocked(txId, msg.sender, txData.target, currentRiskScore, "Risk increased during quarantine");
            if (txData.value > 0) {
                payable(msg.sender).transfer(txData.value);
            }
            return;
        }

        _executeTransaction(txId);
    }

    function _executeTransaction(bytes32 txId) internal returns (bytes32) {
        TransactionData storage txData = pendingTransactions[txId];
        txData.executed = true;

        (bool success, ) = txData.target.call{value: txData.value}(txData.data);
        
        emit TransactionExecuted(txId, msg.sender, success);
        
        if (!success && txData.value > 0) {
            payable(msg.sender).transfer(txData.value);
        }

        return txId;
    }

    function emergencyCancel(bytes32 txId) external {
        TransactionData storage txData = pendingTransactions[txId];
        require(txData.timestamp > 0, "Transaction not found");
        require(!txData.executed, "Transaction already executed");

        uint256 currentRiskScore = securityRegistry.getRiskScore(txData.target);
        
        if (currentRiskScore >= HIGH_RISK_THRESHOLD) {
            txData.executed = true;
            if (txData.value > 0) {
                payable(msg.sender).transfer(txData.value);
            }
            emit TransactionBlocked(txId, msg.sender, txData.target, currentRiskScore, "Emergency cancellation");
            securityRegistry.recordThreatBlocked(msg.sender);
        }
    }

    function batchExecute(
        address[] calldata targets,
        bytes[] calldata datas,
        uint256[] calldata values
    ) external payable nonReentrant notEmergencyBlocked notInEmergencyMode returns (bytes32[] memory) {
        require(targets.length == datas.length && datas.length == values.length, "Array length mismatch");
        require(targets.length <= 10, "Too many transactions");

        uint256 totalValue = 0;
        for (uint256 i = 0; i < values.length; i++) {
            totalValue = totalValue.add(values[i]);
        }
        require(msg.value >= totalValue, "Insufficient ETH sent");

        bytes32[] memory txIds = new bytes32[](targets.length);
        
        for (uint256 i = 0; i < targets.length; i++) {
            txIds[i] = this.safeExecute{value: values[i]}(targets[i], datas[i], values[i]);
        }

        return txIds;
    }

    function emergencyBlockUser(address user, string memory reason) external onlyOwner {
        emergencyBlocked[user] = true;
        emit UserEmergencyBlocked(user, reason);
    }

    function unblockUser(address user) external onlyOwner {
        emergencyBlocked[user] = false;
    }

    function toggleEmergencyMode() external onlyOwner {
        emergencyMode = !emergencyMode;
        emit EmergencyModeToggled(emergencyMode);
    }

    function setBypassMode(bool _bypassMode) external onlyOwner {
        bypassMode = _bypassMode;
    }

    function directExecute(
        address target,
        bytes calldata data,
        uint256 value
    ) external payable onlyOwner returns (bool) {
        require(bypassMode, "Bypass mode not enabled");
        (bool success, ) = target.call{value: value}(data);
        return success;
    }

    function getTransactionData(bytes32 txId) external view returns (
        address target,
        bytes memory data,
        uint256 value,
        uint256 timestamp,
        bool executed,
        uint256 riskScore
    ) {
        TransactionData memory txData = pendingTransactions[txId];
        return (
            txData.target,
            txData.data,
            txData.value,
            txData.timestamp,
            txData.executed,
            txData.riskScore
        );
    }

    function getPendingTransactionCount() external view returns (uint256) {
        return userNonces[msg.sender];
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    receive() external payable {}
}