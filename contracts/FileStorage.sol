// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/utils/Strings.sol";

contract FileStorage {
    using Strings for uint256;

    struct File {
        string id;
        string metadata;
        address owner;
        uint256 timestamp;
        bool exists;
    }
    
    // Mapping from file ID to File struct
    mapping(string => File) private files;
    
    // Mapping from user address to their file IDs
    mapping(address => string[]) private userFiles;
    
    // Events
    event FileStored(string id, address owner, uint256 timestamp);
    event FileDeleted(string id, address owner);
    
    /**
     * Store file metadata on the blockchain
     * @param metadata JSON string containing file metadata (IPFS hashes, encryption keys, etc.)
     * @return id The generated file ID
     */
    function storeFile(string memory metadata) public returns (string memory) {
        // Generate a unique ID for the file
        string memory id = generateId(metadata, msg.sender);
        
        // Store the file metadata
        files[id] = File({
            id: id,
            metadata: metadata,
            owner: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });
        
        // Add the file ID to the user's files
        userFiles[msg.sender].push(id);
        
        // Emit event
        emit FileStored(id, msg.sender, block.timestamp);
        
        return id;
    }
    
    /**
     * Get file metadata by ID
     * @param id The file ID
     * @return metadata The file metadata
     */
    function getFile(string memory id) public view returns (string memory) {
        require(files[id].exists, "File does not exist");
        require(files[id].owner == msg.sender, "Not authorized");
        
        return files[id].metadata;
    }
    
    /**
     * Get all files for a user
     * @param owner The user address
     * @return fileIds Array of file IDs
     */
    function getUserFiles(address owner) public view returns (string[] memory) {
        return userFiles[owner];
    }
    
    /**
     * Delete a file
     * @param id The file ID
     */
    function deleteFile(string memory id) public {
        require(files[id].exists, "File does not exist");
        require(files[id].owner == msg.sender, "Not authorized");
        
        // Mark the file as deleted
        files[id].exists = false;
        
        // Remove the file ID from the user's files
        // Note: This is a simplified implementation that doesn't actually remove the ID
        // from the array, but marks it as deleted in the mapping
        
        // Emit event
        emit FileDeleted(id, msg.sender);
    }
    
    /**
     * Generate a unique ID for a file
     * @param metadata The file metadata
     * @param owner The file owner
     * @return id The generated file ID
     */
    function generateId(string memory metadata, address owner) private view returns (string memory) {
        bytes32 hash = keccak256(abi.encodePacked(metadata, owner, block.timestamp, block.prevrandao));
        return Strings.toHexString(uint256(hash), 32);
    }
}
