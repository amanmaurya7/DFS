"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import { ethers } from "ethers"

interface AccountContextType {
  isConnected: boolean
  address: string | null
  isConnecting: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

const AccountContext = createContext<AccountContextType>({
  isConnected: false,
  address: null,
  isConnecting: false,
  connect: async () => {},
  disconnect: async () => {},
})

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  useEffect(() => {
    // Check if already connected
    checkConnection()

    // Listen for account changes
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged)
    }

    return () => {
      if (typeof window !== "undefined" && window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
      }
    }
  }, [])

  const checkConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const accounts = await provider.listAccounts()

        if (accounts.length > 0) {
          setAddress(accounts[0])
          setIsConnected(true)
        }
      } catch (error) {
        console.error("Failed to check connection:", error)
      }
    }
  }

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected
      setIsConnected(false)
      setAddress(null)
    } else {
      // Account changed
      setAddress(accounts[0])
      setIsConnected(true)
    }
  }

  const connect = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("MetaMask is not installed")
    }

    try {
      setIsConnecting(true)
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const accounts = await provider.send("eth_requestAccounts", [])

      if (accounts.length > 0) {
        setAddress(accounts[0])
        setIsConnected(true)
      }
    } catch (error) {
      console.error("Failed to connect:", error)
      throw error
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnect = async () => {
    setIsConnected(false)
    setAddress(null)
  }

  return (
    <AccountContext.Provider
      value={{
        isConnected,
        address,
        isConnecting,
        connect,
        disconnect,
      }}
    >
      {children}
    </AccountContext.Provider>
  )
}

export function useAccount() {
  return useContext(AccountContext)
}
