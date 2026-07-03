// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./OPNChiaToken.sol";

/**
 * @title OPNChiaBondingCurve
 * @notice Bonding curve for a single token — buy/sell with dynamic pricing
 * Formula: price = basePrice + (currentSupply * curveCoefficient)
 */
contract OPNChiaBondingCurve {
    // ── Events ──
    event TokensPurchased(address indexed buyer, uint256 amount, uint256 cost, uint256 newSupply);
    event TokensSold(address indexed seller, uint256 amount, uint256 returnAmount, uint256 newSupply);
    event MigratedToDex(uint256 totalLiquidity, uint256 tokenAmount, uint256 iopnAmount);

    // ── State ──
    OPNChiaToken public token;
    address public factory;
    address public creator;
    address public migrator;

    string public tokenName;
    string public tokenSymbol;

    // Bonding curve params
    uint256 public totalSupply;
    uint256 public currentSupply;
    uint256 public tokensForSale;
    uint256 public basePrice;          // Starting price in wei
    uint256 public curveCoefficient;   // Price increase per token sold
    uint256 public migrationThreshold; // Total IOPN value to trigger migration
    uint256 public totalRaised;

    bool public migrated;
    bool public isActive;

    uint8 public tokenDecimals;

    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory");
        _;
    }

    modifier onlyMigrator() {
        require(msg.sender == migrator, "Only migrator");
        _;
    }

    constructor(
        address _token,
        address _creator,
        address _migrator,
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply,
        uint256 _tokensForSale,
        uint256 _basePrice,
        uint256 _curveCoefficient,
        uint256 _migrationThreshold,
        uint8 _tokenDecimals
    ) {
        token = OPNChiaToken(_token);
        factory = msg.sender;
        creator = _creator;
        migrator = _migrator;
        tokenName = _name;
        tokenSymbol = _symbol;
        totalSupply = _totalSupply;
        currentSupply = 0;
        tokensForSale = _tokensForSale;
        basePrice = _basePrice;
        curveCoefficient = _curveCoefficient;
        migrationThreshold = _migrationThreshold;
        totalRaised = 0;
        migrated = false;
        isActive = true;
        tokenDecimals = _tokenDecimals;
    }

    // ── BUY TOKENS ──
    function buyTokens() external payable returns (uint256) {
        require(isActive, "Curve not active");
        require(!migrated, "Already migrated");
        require(msg.value > 0, "Send IOPN");

        uint256 tokensToBuy = _calculateTokenAmount(msg.value, currentSupply);
        require(currentSupply + tokensToBuy <= tokensForSale, "Exceeds tokens for sale");

        // Mint tokens to buyer
        token.mint(msg.sender, tokensToBuy);

        currentSupply += tokensToBuy;
        totalRaised += msg.value;

        emit TokensPurchased(msg.sender, tokensToBuy, msg.value, currentSupply);

        // Check if migration threshold hit
        if (totalRaised >= migrationThreshold) {
            _triggerMigration();
        }

        return tokensToBuy;
    }

    // ── SELL TOKENS ──
    function sellTokens(uint256 tokenAmount) external returns (uint256) {
        require(isActive, "Curve not active");
        require(!migrated, "Already migrated");
        require(tokenAmount > 0, "Send tokens");
        require(token.balanceOf(msg.sender) >= tokenAmount, "Insufficient balance");

        // Burn tokens
        token.burnFrom(msg.sender, tokenAmount);

        // Calculate IOPN return based on current curve price
        uint256 returnAmount = _calculateIopnReturn(tokenAmount, currentSupply);
        currentSupply -= tokenAmount;

        // Send IOPN (contract must have balance)
        (bool success, ) = payable(msg.sender).call{value: returnAmount}("");
        require(success, "IOPN transfer failed");

        emit TokensSold(msg.sender, tokenAmount, returnAmount, currentSupply);

        return returnAmount;
    }

    // ── GET PRICE ──
    function getCurrentPrice() public view returns (uint256) {
        if (currentSupply >= tokensForSale) return type(uint256).max;
        uint256 supplyInTokens = currentSupply / 10**tokenDecimals;
        if (supplyInTokens == 0) return basePrice;
        return basePrice + (supplyInTokens * curveCoefficient);
    }

    function getCurrentPriceInTokens(uint256 iopnAmount) public view returns (uint256) {
        return _calculateTokenAmount(iopnAmount, currentSupply);
    }

    // ── MIGRATION ──
    function _triggerMigration() internal {
        migrated = true;
        isActive = false;

        uint256 iopnForLiquidity = totalRaised * 80 / 100; // 80% to DEX
        uint256 tokenForLiquidity = currentSupply * 80 / 100; // 80% tokens

        // Approve tokens for migrator
        token.approve(migrator, tokenForLiquidity);

        emit MigratedToDex(iopnForLiquidity, tokenForLiquidity, iopnForLiquidity);
    }

    function getTotalRaised() external view returns (uint256) {
        return totalRaised;
    }

    // ── INTERNAL MATH ──
    function _calculateTokenAmount(uint256 iopnAmount, uint256 supply) internal view returns (uint256) {
        uint256 supplyInTokens = supply / 10**tokenDecimals;
        uint256 price = supplyInTokens == 0 ? basePrice : basePrice + (supplyInTokens * curveCoefficient);
        return (iopnAmount * 10**tokenDecimals) / price;
    }

    function _calculateIopnReturn(uint256 tokenAmount, uint256 supply) internal view returns (uint256) {
        uint256 netSupplyInTokens = (supply - tokenAmount) / 10**tokenDecimals;
        uint256 price = netSupplyInTokens == 0 ? basePrice : basePrice + (netSupplyInTokens * curveCoefficient);
        return (tokenAmount * price) / 10**tokenDecimals;
    }

    // ── ADMIN ──
    function emergencyWithdraw(address to) external onlyFactory {
        (bool success, ) = payable(to).call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }

    receive() external payable {}
}
