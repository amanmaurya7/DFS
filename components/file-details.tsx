"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Download, Share, Shield, Clock, FileText, LinkIcon } from "lucide-react"
import { formatDate, formatFileSize } from "@/lib/utils"
import { downloadFromPinata } from "@/lib/pinata"
import { decryptFile } from "@/lib/file-utils"

interface FileDetailsProps {
  file: {
    id: string
    fileName: string
    fileSize: number
    fileType: string
    ipfsHashes: string[]
    encryptionKey: string
    timestamp: number
  }
  onClose: () => void
}

export function FileDetails({ file, onClose }: FileDetailsProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareEmail, setShareEmail] = useState("")
  const [sharePermission, setSharePermission] = useState("read")

  const handleDownload = async () => {
    try {
      setIsDownloading(true)

      // Download file chunks from IPFS
      const encryptedData = await downloadFromPinata(file.ipfsHashes)

      // Decrypt the data
      const decryptedData = await decryptFile(encryptedData, file.encryptionKey)

      // Create a download link
      const blob = new Blob([decryptedData], { type: file.fileType })
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = file.fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download failed:", error)
      alert("Failed to download file. Please try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleShare = () => {
    // In a real app, this would call a smart contract function to share the file
    alert(`File shared with ${shareEmail} with ${sharePermission} permission`)
    setShowShareDialog(false)
    setShareEmail("")
  }

  const getIpfsUrl = (hash: string) => {
    return `https://gateway.pinata.cloud/ipfs/${hash}`
  }

  return (
    <>
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {file.fileName}
          </CardTitle>
          <CardDescription>
            Uploaded on {formatDate(file.timestamp)} • {formatFileSize(file.fileSize)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="storage">Storage</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-4">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">File Type</span>
                  <span className="text-sm">{file.fileType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Size</span>
                  <span className="text-sm">{formatFileSize(file.fileSize)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uploaded</span>
                  <span className="text-sm">{formatDate(file.timestamp)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">File ID</span>
                  <span className="text-sm font-mono">{file.id.substring(0, 10)}...</span>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="storage" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    IPFS
                  </Badge>
                  <span className="text-sm">File is stored on IPFS in {file.ipfsHashes.length} chunks</span>
                </div>
                <div className="space-y-1">
                  {file.ipfsHashes.map((hash, index) => (
                    <div key={index} className="flex items-center justify-between rounded-md border p-2 text-sm">
                      <span className="font-mono">
                        {hash.substring(0, 6)}...{hash.substring(hash.length - 4)}
                      </span>
                      <a
                        href={getIpfsUrl(hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-blue-500 hover:underline"
                      >
                        <LinkIcon className="h-3 w-3" />
                        View
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="security" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Shield className="h-3 w-3" />
                    Encrypted
                  </Badge>
                  <span className="text-sm">File is encrypted with a unique key</span>
                </div>
                <div className="rounded-md border p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Encryption Key</span>
                    <span className="text-sm font-mono">
                      {file.encryptionKey.substring(0, 6)}...
                      {file.encryptionKey.substring(file.encryptionKey.length - 4)}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowShareDialog(true)}>
              <Share className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button onClick={handleDownload} disabled={isDownloading}>
              <Download className="mr-2 h-4 w-4" />
              {isDownloading ? "Downloading..." : "Download"}
            </Button>
          </div>
        </CardFooter>
      </Card>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share File</DialogTitle>
            <DialogDescription>Share this file with other users by email address.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="permission">Permission</Label>
              <select
                id="permission"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={sharePermission}
                onChange={(e) => setSharePermission(e.target.value)}
              >
                <option value="read">Read only</option>
                <option value="write">Read and write</option>
                <option value="admin">Admin (full control)</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShareDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleShare} disabled={!shareEmail}>
              Share
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
