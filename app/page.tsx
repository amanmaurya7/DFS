"use client"

import { useState } from "react"
import { FileUploader } from "@/components/file-uploader"
import { FileList } from "@/components/file-list"
import { ConnectWallet } from "@/components/connect-wallet"
import { useAccount } from "@/hooks/use-account"
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function Home() {
  const { isConnected, address } = useAccount()
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleUploadSuccess = (ipfsHash: string) => {
    setUploadSuccess(`File uploaded successfully! IPFS Hash: ${ipfsHash}`)
    setUploadError(null)
    // Reset success message after 5 seconds
    setTimeout(() => setUploadSuccess(null), 5000)
  }

  const handleUploadError = (error: string) => {
    setUploadError(error)
    setUploadSuccess(null)
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8 lg:p-12">
      <div className="w-full max-w-4xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Decentralized File Storage</h1>
          <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Securely store and share files using IPFS and Polygon Amoy Testnet
          </p>
        </div>

        {!isConnected ? (
          <div className="flex flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-10 text-center">
            <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
            <p className="text-sm text-gray-500">Connect your wallet to start uploading and managing files</p>
            <ConnectWallet />
          </div>
        ) : (
          <div className="space-y-6">
            {uploadSuccess && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <AlertCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{uploadSuccess}</AlertDescription>
              </Alert>
            )}

            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            <FileUploader onUploadSuccess={handleUploadSuccess} onUploadError={handleUploadError} />

            <div className="rounded-lg border bg-card">
              <div className="p-6">
                <h3 className="text-lg font-semibold">Your Files</h3>
                <p className="text-sm text-gray-500">Files you've uploaded to the decentralized storage</p>
              </div>
              <FileList walletAddress={address} />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
