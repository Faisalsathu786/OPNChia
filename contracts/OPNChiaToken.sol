// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";

contract OPNChiaToken is ERC20, ERC20Burnable {
    address public factory;
    uint8 private _decimals;
    mapping(address => bool) public authorizedMinters;

    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory");
        _;
    }

    modifier onlyAuthorized() {
        require(msg.sender == factory || authorizedMinters[msg.sender], "Not authorized");
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

    function authorizeMinter(address minter) external onlyFactory {
        authorizedMinters[minter] = true;
    }

    function revokeMinter(address minter) external onlyFactory {
        authorizedMinters[minter] = false;
    }

    function mint(address to, uint256 amount) external onlyAuthorized {
        _mint(to, amount);
    }

    function burnFrom(address account, uint256 amount) public override onlyAuthorized {
        _burn(account, amount);
    }
}
