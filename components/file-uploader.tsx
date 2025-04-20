"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, File, X, Lock } from "lucide-react"
import { useAccount } from "@/hooks/use-account"
import { useContract } from "@/hooks/use-contract"
import { encryptFile, chunkFile } from "@/lib/file-utils"
import { uploadToPinata } from "@/lib/pinata"

interface FileUploaderProps {
  onUploadSuccess: (ipfsHash: string) => void
  onUploadError: (error: string) => void
}

export function FileUploader({ onUploadSuccess, onUploadError }: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { isConnected } = useAccount()
  const { storeFile } = useContract()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const clearSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !isConnected) return

    try {
      setIsUploading(true)
      setUploadProgress(10)

      // Step 1: Encrypt the file
      setUploadProgress(20)
      const { encryptedData, encryptionKey } = await encryptFile(selectedFile)

      // Step 2: Split into chunks if needed
      setUploadProgress(30)
      const chunks = await chunkFile(encryptedData, 1024 * 1024) // 1MB chunks

      // Step 3: Upload to Pinata
      setUploadProgress(50)
      const ipfsHashes = await uploadToPinata(chunks, selectedFile.name)
      setUploadProgress(80)

      // Step 4: Store metadata on blockchain
      const metadata = {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        ipfsHashes,
        encryptionKey: encryptionKey, // In a real app, this should be encrypted with the user's public key
        timestamp: Date.now(),
      }

      await storeFile(JSON.stringify(metadata))
      setUploadProgress(100)

      // Success
      onUploadSuccess(ipfsHashes[0]) // Return the first hash for simplicity
      clearSelectedFile()
    } catch (error) {
      console.error("Upload failed:", error)
      onUploadError(error instanceof Error ? error.message : "Upload failed")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 ${
            selectedFile ? "border-green-400 bg-green-50" : "border-gray-300"
          }`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {!selectedFile ? (
            <>
              <div className="mb-4 rounded-full bg-primary/10 p-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-1 text-lg font-semibold">Upload a file</h3>
              <p className="mb-4 text-sm text-gray-500">Drag and drop or click to select</p>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
              <Button onClick={() => fileInputRef.current?.click()}>Select File</Button>
            </>
          ) : (
            <div className="w-full">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <File className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={clearSelectedFile} disabled={isUploading}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {isUploading ? (
                <div className="space-y-2">
                  <Progress value={uploadProgress} />
                  <p className="text-xs text-gray-500">
                    {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : "Processing..."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button className="w-full gap-2" onClick={handleUpload} disabled={!isConnected}>
                    <Lock className="h-4 w-4" />
                    Encrypt & Upload
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
