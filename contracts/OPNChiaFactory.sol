// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./OPNChiaToken.sol";
import "./OPNChiaBondingCurve.sol";

/**
 * @title OPNChiaFactory
 * @notice Anyone can create a token with a bonding curve in one transaction
 * Deploys OPNChiaToken + OPNChiaBondingCurve atomically
 */
contract OPNChiaFactory {
    // ── Events ──
    event TokenCreated(
        address indexed token,
        address indexed bondingCurve,
        address indexed creator,
        string name,
        string symbol,
        uint256 supply,
        uint256 basePrice,
        uint256 migrationThreshold,
        uint256 timestamp
    );

    // ── State ──
    address public migrator;
    address public protocolFeeRecipient;
    uint256 public creationFee; // Fee in IOPN wei

    // All created tokens and curves
    address[] public allTokens;
    address[] public allCurves;
    mapping(address => bool) public isTokenFromFactory;
    mapping(address => address) public tokenToCurve;  // token → curve
    mapping(address => address) public curveToToken;  // curve → token

    modifier onlyMigrator() {
        require(msg.sender == migrator, "Only migrator");
        _;
    }

    constructor(address _migrator, address _feeRecipient, uint256 _creationFee) {
        migrator = _migrator;
        protocolFeeRecipient = _feeRecipient;
        creationFee = _creationFee;
    }

    // ── CREATE TOKEN ──
    function createToken(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint256 tokensForSale,
        uint256 basePrice,
        uint256 curveCoefficient,
        uint256 migrationThreshold,
        uint8 decimals_
    ) external payable returns (address tokenAddress, address curveAddress) {
        require(bytes(name).length > 0, "Name required");
        require(bytes(symbol).length > 0, "Symbol required");
        require(totalSupply > 0, "Supply > 0");
        require(tokensForSale > 0 && tokensForSale <= totalSupply, "Invalid sale amt");
        require(basePrice > 0, "Base price > 0");
        require(curveCoefficient > 0, "Coefficient > 0");
        require(msg.value >= creationFee, "Insufficient fee");

        // Deploy token
        OPNChiaToken newToken = new OPNChiaToken(name, symbol, decimals_);
        tokenAddress = address(newToken);

        // Mint total supply to bonding curve contract
        newToken.mint(address(this), totalSupply);

        // Deploy bonding curve
        OPNChiaBondingCurve curve = new OPNChiaBondingCurve(
            tokenAddress,
            msg.sender,
            migrator,
            name,
            symbol,
            totalSupply,
            tokensForSale,
            basePrice,
            curveCoefficient,
            migrationThreshold,
            decimals_
        );
        curveAddress = address(curve);

        // Authorize bonding curve to mint/burn
        newToken.authorizeMinter(curveAddress);

        // Transfer tokens to bonding curve
        newToken.transfer(curveAddress, tokensForSale);

        // Store mappings
        allTokens.push(tokenAddress);
        allCurves.push(curveAddress);
        isTokenFromFactory[tokenAddress] = true;
        tokenToCurve[tokenAddress] = curveAddress;
        curveToToken[curveAddress] = tokenAddress;

        // Send fee to protocol
        if (creationFee > 0) {
            (bool feeSent, ) = payable(protocolFeeRecipient).call{value: creationFee}("");
            require(feeSent, "Fee transfer failed");
        }

        // Refund extra IOPN
        if (msg.value > creationFee) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - creationFee}("");
            require(refunded, "Refund failed");
        }

        emit TokenCreated(
            tokenAddress, curveAddress, msg.sender,
            name, symbol, totalSupply, basePrice, migrationThreshold, block.timestamp
        );
    }

    // ── GETTERS ──
    function getTokenCount() external view returns (uint256) {
        return allTokens.length;
    }

    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }

    function getAllCurves() external view returns (address[] memory) {
        return allCurves;
    }

    function getTokensByCreator(address creator) external view returns (uint256) {
        uint256 count;
        for (uint256 i = 0; i < allTokens.length; i++) {
            // Note: simplified — in production store creator mapping
        }
        return count;
    }

    // ── ADMIN ──
    function setMigrator(address _migrator) external {
        require(msg.sender == protocolFeeRecipient, "Only admin");
        migrator = _migrator;
    }

    function setCreationFee(uint256 _fee) external {
        require(msg.sender == protocolFeeRecipient, "Only admin");
        creationFee = _fee;
    }

    function withdrawFees() external {
        require(msg.sender == protocolFeeRecipient, "Only admin");
        (bool success, ) = payable(protocolFeeRecipient).call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }

    receive() external payable {}
}
