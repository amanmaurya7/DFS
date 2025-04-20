"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useAccount } from "@/hooks/use-account"
import { useContract } from "@/hooks/use-contract"
import { formatFileSize } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Database, HardDrive, Upload, Clock } from "lucide-react"

export default function DashboardPage() {
  const { isConnected, address } = useAccount()
  const { getUserFiles } = useContract()
  const [files, setFiles] = useState<any[]>([])
  const [totalSize, setTotalSize] = useState(0)
  const [usageData, setUsageData] = useState<any[]>([])

  useEffect(() => {
    if (isConnected && address) {
      loadFiles()
    }
  }, [isConnected, address])

  const loadFiles = async () => {
    try {
      if (!address) return

      const userFiles = await getUserFiles(address)
      setFiles(userFiles)

      // Calculate total size
      const total = userFiles.reduce((sum, file) => sum + file.fileSize, 0)
      setTotalSize(total)

      // Generate usage data for chart
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return date.toISOString().split("T")[0]
      }).reverse()

      const usageByDate = last7Days.map((date) => {
        const filesOnDate = userFiles.filter((file) => {
          const fileDate = new Date(file.timestamp).toISOString().split("T")[0]
          return fileDate === date
        })

        const sizeOnDate = filesOnDate.reduce((sum, file) => sum + file.fileSize, 0)

        return {
          date: date.split("-").slice(1).join("/"), // Format as MM/DD
          size: sizeOnDate / (1024 * 1024), // Convert to MB
          files: filesOnDate.length,
        }
      })

      setUsageData(usageByDate)
    } catch (error) {
      console.error("Failed to load files:", error)
    }
  }

  if (!isConnected) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>Connect your wallet to view your storage dashboard</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-3xl font-bold">Storage Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((totalSize / (1024 * 1024 * 1024)) * 100) / 100} GB of 1 GB used
            </p>
            <Progress value={Math.min((totalSize / (1024 * 1024 * 1024)) * 100, 100)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{files.length}</div>
            <p className="text-xs text-muted-foreground">Files stored on IPFS</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uploads</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {files.filter((f) => new Date(f.timestamp).getMonth() === new Date().getMonth()).length}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {files.length > 0 ? new Date(Math.max(...files.map((f) => f.timestamp))).toLocaleDateString() : "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">Last file upload</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="storage" className="mt-6">
        <TabsList>
          <TabsTrigger value="storage">Storage Usage</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="storage" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Storage Usage (Last 7 Days)</CardTitle>
              <CardDescription>Track your storage usage over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                      yAxisId="left"
                      orientation="left"
                      label={{ value: "Size (MB)", angle: -90, position: "insideLeft" }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      label={{ value: "Files", angle: 90, position: "insideRight" }}
                    />
                    <Tooltip />
                    <Bar yAxisId="left" dataKey="size" name="Size (MB)" fill="#8884d8" />
                    <Bar yAxisId="right" dataKey="files" name="Files" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your recent file operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {files.slice(0, 5).map((file, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-2">
                      {file.fileType.includes("image") ? (
                        <img
                          src={`https://gateway.pinata.cloud/ipfs/${file.ipfsHashes[0]}`}
                          alt={file.fileName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <Database className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{file.fileName}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.fileSize)} • {new Date(file.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                      Uploaded
                    </div>
                  </div>
                ))}

                {files.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Database className="mb-2 h-10 w-10 text-gray-400" />
                    <h3 className="text-lg font-medium">No activity yet</h3>
                    <p className="text-sm text-gray-500">Upload your first file to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
