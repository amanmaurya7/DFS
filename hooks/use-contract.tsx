"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import { ethers } from "ethers"
import { useAccount } from "./use-account"

// ABI for the FileStorage contract
const CONTRACT_ABI = [
  "function storeFile(string memory metadata) public returns (string memory)",
  "function getFile(string memory id) public view returns (string memory)",
  "function getUserFiles(address owner) public view returns (string[] memory)",
  "function deleteFile(string memory fileId) public",
  "event FileStored(string id, address owner, uint256 timestamp)",
  "event FileDeleted(string id, address owner)",
]

// Contract address on Polygon Amoy Testnet - replace with your deployed contract address
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x123456789abcdef123456789abcdef123456789a"

interface ContractContextType {
  storeFile: (metadata: string) => Promise<string>
  getUserFiles: (address: string) => Promise<any[]>
  deleteFile: (fileId: string) => Promise<void>
}

const ContractContext = createContext<ContractContextType>({
  storeFile: async () => "",
  getUserFiles: async () => [],
  deleteFile: async () => {},
})

export function ContractProvider({ children }: { children: React.ReactNode }) {
  const { isConnected } = useAccount()
  const [contract, setContract] = useState<ethers.Contract | null>(null)

  useEffect(() => {
    if (isConnected && typeof window !== "undefined" && window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const fileStorageContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer)
      setContract(fileStorageContract)
    } else {
      setContract(null)
    }
  }, [isConnected])

  const storeFile = async (metadata: string): Promise<string> => {
    if (!contract) throw new Error("Contract not initialized")

    try {
      const tx = await contract.storeFile(metadata)
      const receipt = await tx.wait()

      // Extract the file ID from the event
      const event = receipt.events?.find((e) => e.event === "FileStored")
      const fileId = event?.args?.id

      if (!fileId) {
        throw new Error("Failed to get file ID from transaction")
      }

      return fileId
    } catch (error) {
      console.error("Failed to store file metadata:", error)
      throw error
    }
  }

  const getUserFiles = async (address: string): Promise<any[]> => {
    if (!contract) throw new Error("Contract not initialized")

    try {
      // Get file IDs from the contract
      const fileIds = await contract.getUserFiles(address)

      // If no files, return empty array
      if (!fileIds || fileIds.length === 0) {
        return []
      }

      // Get metadata for each file
      const files = await Promise.all(
        fileIds.map(async (id: string) => {
          try {
            // Get file metadata from contract
            const metadata = await contract.getFile(id)

            // Parse the metadata JSON
            const parsedMetadata = JSON.parse(metadata)

            // Return file with ID and metadata
            return {
              id,
              ...parsedMetadata,
            }
          } catch (error) {
            console.error(`Error getting metadata for file ${id}:`, error)
            return null
          }
        }),
      )

      // Filter out any null values (failed to get metadata)
      return files.filter((file) => file !== null)
    } catch (error) {
      console.error("Failed to get user files:", error)

      // For demo purposes, return mock data if contract call fails
      console.warn("Returning mock data instead")
      return [
        {
          id: "file1",
          fileName: "document.pdf",
          fileSize: 2500000,
          fileType: "application/pdf",
          ipfsHashes: ["QmXyZ123..."],
          encryptionKey: "enc123",
          timestamp: Date.now() - 86400000 * 2,
        },
        {
          id: "file2",
          fileName: "image.jpg",
          fileSize: 1200000,
          fileType: "image/jpeg",
          ipfsHashes: ["QmAbc456..."],
          encryptionKey: "enc456",
          timestamp: Date.now() - 86400000,
        },
        {
          id: "file3",
          fileName: "data.json",
          fileSize: 15000,
          fileType: "application/json",
          ipfsHashes: ["QmDef789..."],
          encryptionKey: "enc789",
          timestamp: Date.now(),
        },
      ]
    }
  }

  const deleteFile = async (fileId: string): Promise<void> => {
    if (!contract) throw new Error("Contract not initialized")

    try {
      const tx = await contract.deleteFile(fileId)
      await tx.wait()
    } catch (error) {
      console.error("Failed to delete file:", error)
      throw error
    }
  }

  return (
    <ContractContext.Provider
      value={{
        storeFile,
        getUserFiles,
        deleteFile,
      }}
    >
      {children}
    </ContractContext.Provider>
  )
}

export function useContract() {
  return useContext(ContractContext)
}
