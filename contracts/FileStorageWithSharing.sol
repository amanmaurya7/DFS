// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/utils/Strings.sol";

contract FileStorageWithSharing {
    using Strings for uint256;

    struct Permission {
        bool canRead;
        bool canWrite;
        bool canDelete;
    }
    
    struct File {
        string id;
        string metadata;
        address owner;
        uint256 timestamp;
        bool exists;
        mapping(address => Permission) permissions;
    }
    
    // Mapping from file ID to File struct
    mapping(string => File) private files;
    
    // Mapping from user address to their file IDs
    mapping(address => string[]) private userFiles;
    
    // Mapping from user address to shared file IDs
    mapping(address => string[]) private sharedFiles;
    
    // Events
    event FileStored(string id, address owner, uint256 timestamp);
    event FileDeleted(string id, address owner);
    event FileShared(string id, address owner, address sharedWith, bool canRead, bool canWrite, bool canDelete);
    
    /**
     * Store file metadata on the blockchain
     * @param metadata JSON string containing file metadata (IPFS hashes, encryption keys, etc.)
     * @return id The generated file ID
     */
    function storeFile(string memory metadata) public returns (string memory) {
        // Generate a unique ID for the file
        string memory id = generateId(metadata, msg.sender);
        
        // Store the file metadata
        File storage newFile = files[id];
        newFile.id = id;
        newFile.metadata = metadata;
        newFile.owner = msg.sender;
        newFile.timestamp = block.timestamp;
        newFile.exists = true;
        
        // Add the file ID to the user's files
        userFiles[msg.sender].push(id);
        
        // Emit event
        emit FileStored(id, msg.sender, block.timestamp);
        
        return id;
    }
    
    /**
     * Share a file with another user
     * @param id The file ID
     * @param user The address to share with
     * @param canRead Whether the user can read the file
     * @param canWrite Whether the user can modify the file
     * @param canDelete Whether the user can delete the file
     */
    function shareFile(string memory id, address user, bool canRead, bool canWrite, bool canDelete) public {
        require(files[id].exists, "File does not exist");
        require(files[id].owner == msg.sender, "Not authorized");
        require(user != address(0), "Invalid address");
        
        // Set permissions
        files[id].permissions[user] = Permission({
            canRead: canRead,
            canWrite: canWrite,
            canDelete: canDelete
        });
        
        // Add to shared files if not already there
        bool alreadyShared = false;
        for (uint i = 0; i < sharedFiles[user].length; i++) {
            if (keccak256(bytes(sharedFiles[user][i])) == keccak256(bytes(id))) {
                alreadyShared = true;
                break;
            }
        }
        
        if (!alreadyShared) {
            sharedFiles[user].push(id);
        }
        
        // Emit event
        emit FileShared(id, msg.sender, user, canRead, canWrite, canDelete);
    }
    
    /**
     * Get file metadata by ID
     * @param id The file ID
     * @return metadata The file metadata
     */
    function getFile(string memory id) public view returns (string memory) {
        require(files[id].exists, "File does not exist");
        require(
            files[id].owner == msg.sender || files[id].permissions[msg.sender].canRead,
            "Not authorized"
        );
        
        return files[id].metadata;
    }
    
    /**
     * Get all files owned by a user
     * @param owner The user address
     * @return fileIds Array of file IDs
     */
    function getUserFiles(address owner) public view returns (string[] memory) {
        return userFiles[owner];
    }
    
    /**
     * Get all files shared with a user
     * @param user The user address
     * @return fileIds Array of file IDs
     */
    function getSharedFiles(address user) public view returns (string[] memory) {
        require(user == msg.sender, "Can only get your own shared files");
        return sharedFiles[user];
    }
    
    /**
     * Check if a user has permission for a file
     * @param id The file ID
     * @param user The user address
     * @return canRead Whether the user can read the file
     * @return canWrite Whether the user can write to the file
     * @return canDelete Whether the user can delete the file
     */
    function checkPermission(string memory id, address user) public view returns (bool canRead, bool canWrite, bool canDelete) {
        require(files[id].exists, "File does not exist");
        
        if (files[id].owner == user) {
            return (true, true, true);
        }
        
        Permission memory perm = files[id].permissions[user];
        return (perm.canRead, perm.canWrite, perm.canDelete);
    }
    
    /**
     * Delete a file
     * @param id The file ID
     */
    function deleteFile(string memory id) public {
        require(files[id].exists, "File does not exist");
        require(
            files[id].owner == msg.sender || files[id].permissions[msg.sender].canDelete,
            "Not authorized"
        );
        
        // Mark the file as deleted
        files[id].exists = false;
        
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
