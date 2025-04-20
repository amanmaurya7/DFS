"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { formatFileSize } from "@/lib/utils"

// ABI for the StorageToken contract
const TOKEN_ABI = [
  "function calculateCost(uint256 sizeInBytes) public view returns (uint256)",
  "function payForStorage(uint256 sizeInBytes, address recipient) public returns (bool)",
  "function getFreeTokens(uint256 amount) public",
  "function balanceOf(address account) public view returns (uint256)",
]

// Contract address for the StorageToken contract
const TOKEN_ADDRESS = "0x123456789abcdef123456789abcdef123456789b" // Replace with your deployed token contract address

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  fileSize: number
  onPaymentComplete: () => void
}

export function PaymentModal({ isOpen, onClose, fileSize, onPaymentComplete }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleGetFreeTokens = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("MetaMask is not installed")
      return
    }

    try {
      setIsProcessing(true)
      setProgress(10)
      setError(null)

      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer)

      setProgress(30)
      // Get 100 free tokens
      const tx = await tokenContract.getFreeTokens(ethers.utils.parseEther("100"))

      setProgress(50)
      await tx.wait()

      setProgress(100)
      setTimeout(() => {
        setIsProcessing(false)
        setProgress(0)
      }, 1000)
    } catch (error) {
      console.error("Failed to get free tokens:", error)
      setError("Failed to get free tokens. Please try again.")
      setIsProcessing(false)
    }
  }

  const handlePayForStorage = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("MetaMask is not installed")
      return
    }

    try {
      setIsProcessing(true)
      setProgress(10)
      setError(null)

      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer)

      // Calculate cost
      const cost = await tokenContract.calculateCost(fileSize)
      console.log(`Storage cost: ${ethers.utils.formatEther(cost)} tokens`)

      setProgress(30)
      // Check balance
      const balance = await tokenContract.balanceOf(await signer.getAddress())

      if (balance.lt(cost)) {
        setError(`Insufficient balance. You need ${ethers.utils.formatEther(cost)} tokens.`)
        setIsProcessing(false)
        return
      }

      setProgress(50)
      // Pay for storage
      const tx = await tokenContract.payForStorage(fileSize, TOKEN_ADDRESS)

      setProgress(70)
      await tx.wait()

      setProgress(100)
      setTimeout(() => {
        setIsProcessing(false)
        setProgress(0)
        onPaymentComplete()
      }, 1000)
    } catch (error) {
      console.error("Payment failed:", error)
      setError("Payment failed. Please try again.")
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Storage Payment</DialogTitle>
          <DialogDescription>Pay for storing your file on the decentralized network.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">File Size:</span>
            <span className="text-sm">{formatFileSize(fileSize)}</span>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-xs text-gray-500">{progress < 100 ? `Processing... ${progress}%` : "Complete!"}</p>
            </div>
          )}

          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        </div>

        <DialogFooter className="flex flex-col space-y-2 sm:space-y-0">
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={handleGetFreeTokens} disabled={isProcessing} className="sm:flex-1">
              Get Free Tokens
            </Button>
            <Button onClick={handlePayForStorage} disabled={isProcessing} className="sm:flex-1">
              Pay for Storage
            </Button>
          </div>
          <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
