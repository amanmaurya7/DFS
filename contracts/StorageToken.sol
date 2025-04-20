// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StorageToken is ERC20, Ownable {
    // Cost per MB of storage in tokens
    uint256 public costPerMB = 1 * 10**18; // 1 token per MB
    
    constructor() ERC20("Storage Token", "STG") Ownable(msg.sender) {
        // Mint initial supply to contract creator
        _mint(msg.sender, 1000000 * 10**18); // 1 million tokens
    }
    
    /**
     * Mint tokens to an address (only owner)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * Set the cost per MB of storage
     * @param newCost New cost per MB in tokens
     */
    function setCostPerMB(uint256 newCost) public onlyOwner {
        costPerMB = newCost;
    }
    
    /**
     * Calculate storage cost
     * @param sizeInBytes Size of the file in bytes
     * @return cost Cost in tokens
     */
    function calculateCost(uint256 sizeInBytes) public view returns (uint256) {
        // Convert bytes to MB (rounded up)
        uint256 sizeInMB = (sizeInBytes + 1048575) / 1048576; // 1MB = 1,048,576 bytes
        return sizeInMB * costPerMB;
    }
    
    /**
     * Pay for storage
     * @param sizeInBytes Size of the file in bytes
     * @param recipient Address to receive the payment
     * @return success Whether the payment was successful
     */
    function payForStorage(uint256 sizeInBytes, address recipient) public returns (bool) {
        uint256 cost = calculateCost(sizeInBytes);
        return transfer(recipient, cost);
    }
    
    /**
     * Get free tokens (for testing)
     * @param amount Amount of tokens to get (max 100)
     */
    function getFreeTokens(uint256 amount) public {
        require(amount <= 100 * 10**18, "Cannot get more than 100 tokens at once");
        _mint(msg.sender, amount);
    }
}
