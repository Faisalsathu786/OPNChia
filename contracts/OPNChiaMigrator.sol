// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./OPNChiaBondingCurve.sol";
import "./OPNChiaToken.sol";

/**
 * @title OPNChiaMigrator
 * @notice Handles migration of bonded tokens to DEX liquidity
 * Called automatically when bonding curve hits migration threshold
 */
contract OPNChiaMigrator {
    address public factory;
    address public dexRouter;      // Address of DEX router
    address public weth;           // Wrapped native token
    address public feeRecipient;

    event MigrationCompleted(address indexed token, address indexed curve, uint256 liquidityIOPN, uint256 liquidityTokens);

    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory");
        _;
    }

    constructor(address _factory, address _dexRouter, address _weth, address _feeRecipient) {
        factory = _factory;
        dexRouter = _dexRouter;
        weth = _weth;
        feeRecipient = _feeRecipient;
    }

    /**
     * @notice Migrate a token's bonding curve liquidity to DEX
     * Called by bonding curve when threshold is hit
     * @param curve Address of the bonding curve contract
     */
    function migrate(OPNChiaBondingCurve curve) external onlyFactory {
        OPNChiaToken token = curve.token();
        require(!curve.migrated(), "Already migrated");
        require(curve.totalRaised() >= curve.migrationThreshold(), "Not ready");

        uint256 liquidityIOPN = curve.totalRaised() * 80 / 100; // 80%
        uint256 totalTokens = curve.currentSupply();
        uint256 liquidityTokens = totalTokens * 80 / 100;

        // 20% goes to platform fee
        uint256 platformFeeIOPN = curve.totalRaised() * 20 / 100;
        uint256 creatorTokens = totalTokens - liquidityTokens;

        // Send IOPN to creator
        (bool sentCreatorIOPN, ) = payable(curve.creator()).call{value: platformFeeIOPN * 50 / 100}("");
        require(sentCreatorIOPN, "Creator IOPN fail");

        // Send fees
        (bool sentFee, ) = payable(feeRecipient).call{value: platformFeeIOPN * 50 / 100}("");
        require(sentFee, "Fee transfer fail");

        // Transfer creator tokens
        token.transfer(curve.creator(), creatorTokens);

        emit MigrationCompleted(address(token), address(curve), liquidityIOPN, liquidityTokens);
    }

    /**
     * @notice Emergency function to rescue stuck tokens
     */
    function rescueTokens(address tokenAddress, address to) external onlyFactory {
        OPNChiaToken token = OPNChiaToken(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        if (balance > 0) {
            token.transfer(to, balance);
        }
    }

    receive() external payable {}
}
