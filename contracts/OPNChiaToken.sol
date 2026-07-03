// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title OPNChiaToken
 * @notice Standard ERC-20 token created via OPNChia Factory
 * Minted on buy, burned on sell via bonding curve
 */
contract OPNChiaToken is ERC20, ERC20Burnable {
    address public factory;
    uint8 private _decimals;

    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory");
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) {
        factory = msg.sender;
        _decimals = decimals_;
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }

    function mint(address to, uint256 amount) external onlyFactory {
        _mint(to, amount);
    }

    function burnFrom(address account, uint256 amount) public override onlyFactory {
        _burn(account, amount);
    }
}
