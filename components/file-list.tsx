"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, ExternalLink, FileText, Trash2, Info } from "lucide-react"
import { useContract } from "@/hooks/use-contract"
import { formatDate, formatFileSize } from "@/lib/utils"
import { downloadFromPinata } from "@/lib/pinata"
import { FileDetails } from "./file-details"

interface FileMetadata {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  ipfsHashes: string[]
  encryptionKey: string
  timestamp: number
}

interface FileListProps {
  walletAddress: string | null
}

export function FileList({ walletAddress }: FileListProps) {
  const [files, setFiles] = useState<FileMetadata[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null)
  const { getUserFiles, deleteFile } = useContract()

  useEffect(() => {
    if (walletAddress) {
      loadFiles()
    }
  }, [walletAddress])

  const loadFiles = async () => {
    try {
      setIsLoading(true)
      if (!walletAddress) return

      const userFiles = await getUserFiles(walletAddress)
      setFiles(userFiles)
    } catch (error) {
      console.error("Failed to load files:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async (file: FileMetadata) => {
    try {
      setIsDownloading(file.id)

      // Download file chunks from IPFS
      const encryptedData = await downloadFromPinata(file.ipfsHashes)

      // In a real app, decrypt the data using the encryption key
      // const decryptedData = await decryptFile(encryptedData, file.encryptionKey);

      // For demo purposes, just download the encrypted data
      const blob = new Blob([encryptedData])
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
    } finally {
      setIsDownloading(null)
    }
  }

  const handleDelete = async (fileId: string) => {
    try {
      await deleteFile(fileId)
      setFiles(files.filter((file) => file.id !== fileId))
    } catch (error) {
      console.error("Delete failed:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <FileText className="mb-2 h-10 w-10 text-gray-400" />
        <h3 className="text-lg font-medium">No files found</h3>
        <p className="text-sm text-gray-500">Upload your first file to get started</p>
      </div>
    )
  }

  if (selectedFile) {
    return <FileDetails file={selectedFile} onClose={() => setSelectedFile(null)} />
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Uploaded</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => (
            <TableRow key={file.id}>
              <TableCell className="font-medium">{file.fileName}</TableCell>
              <TableCell>{formatFileSize(file.fileSize)}</TableCell>
              <TableCell>{formatDate(file.timestamp)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="icon" onClick={() => setSelectedFile(file)} title="View details">
                    <Info className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDownload(file)}
                    disabled={isDownloading === file.id}
                    title="Download file"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" asChild title="View on IPFS">
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${file.ipfsHashes[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => handleDelete(file.id)} title="Delete file">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
