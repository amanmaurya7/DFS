"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAccount } from "@/hooks/use-account"
import { Loader2, LogOut, Wallet } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { shortenAddress } from "@/lib/utils"

export function ConnectWallet() {
  const { isConnected, address, connect, disconnect, isConnecting } = useAccount()
  const [showDialog, setShowDialog] = useState(false)

  const handleConnect = async () => {
    try {
      await connect()
      setShowDialog(false)
    } catch (error) {
      console.error("Failed to connect wallet:", error)
    }
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
    } catch (error) {
      console.error("Failed to disconnect wallet:", error)
    }
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" className="gap-2">
          <Wallet className="h-4 w-4" />
          {shortenAddress(address)}
        </Button>
        <Button variant="ghost" size="icon" onClick={handleDisconnect}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button onClick={() => setShowDialog(true)} disabled={isConnecting}>
        {isConnecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Your Wallet</DialogTitle>
            <DialogDescription>Connect your wallet to use the decentralized file storage system.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Button onClick={handleConnect} className="w-full">
              <Wallet className="mr-2 h-4 w-4" />
              Connect with MetaMask
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
