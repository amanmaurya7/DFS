import axios from "axios"

// Pinata API endpoints
const PINATA_API_URL = "https://api.pinata.cloud"
const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs/"

/**
 * Uploads file chunks to Pinata IPFS
 * @param chunks Array of file chunks to upload
 * @param fileName Original file name for reference
 * @returns Array of IPFS hashes for the uploaded chunks
 */
export async function uploadToPinata(chunks: Uint8Array[], fileName: string): Promise<string[]> {
  console.log(`Uploading ${chunks.length} chunks for file: ${fileName}`)

  const ipfsHashes: string[] = []

  // Get JWT from environment variable
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT

  if (!jwt) {
    throw new Error("Pinata JWT not found. Please set the NEXT_PUBLIC_PINATA_JWT environment variable.")
  }

  // Upload each chunk to Pinata
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]
    const chunkName = `${fileName}.part${i + 1}_of_${chunks.length}`

    // Create form data for the file
    const formData = new FormData()
    const blob = new Blob([chunk])
    formData.append("file", blob, chunkName)

    // Add metadata
    const metadata = JSON.stringify({
      name: chunkName,
      keyvalues: {
        fileName,
        chunkIndex: i,
        totalChunks: chunks.length,
      },
    })
    formData.append("pinataMetadata", metadata)

    // Add options
    const options = JSON.stringify({
      cidVersion: 1,
    })
    formData.append("pinataOptions", options)

    try {
      // Upload to Pinata
      const response = await axios.post(`${PINATA_API_URL}/pinning/pinFileToIPFS`, formData, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "multipart/form-data",
        },
      })

      // Add the IPFS hash to the array
      ipfsHashes.push(response.data.IpfsHash)
      console.log(`Uploaded chunk ${i + 1}/${chunks.length}: ${response.data.IpfsHash}`)
    } catch (error) {
      console.error(`Error uploading chunk ${i + 1}/${chunks.length}:`, error)
      throw error
    }
  }

  console.log("Upload complete, IPFS hashes:", ipfsHashes)
  return ipfsHashes
}

/**
 * Downloads file chunks from Pinata IPFS
 * @param ipfsHashes Array of IPFS hashes to download
 * @returns Combined data from all chunks
 */
export async function downloadFromPinata(ipfsHashes: string[]): Promise<Uint8Array> {
  console.log(`Downloading ${ipfsHashes.length} chunks from IPFS`)

  // Download each chunk
  const chunks: ArrayBuffer[] = []

  for (let i = 0; i < ipfsHashes.length; i++) {
    const hash = ipfsHashes[i]
    try {
      // Download from Pinata gateway
      const response = await axios.get(`${PINATA_GATEWAY}${hash}`, {
        responseType: "arraybuffer",
      })

      chunks.push(response.data)
      console.log(`Downloaded chunk ${i + 1}/${ipfsHashes.length}`)
    } catch (error) {
      console.error(`Error downloading chunk ${i + 1}/${ipfsHashes.length}:`, error)
      throw error
    }
  }

  // Combine all chunks
  const totalLength = chunks.reduce((total, chunk) => total + chunk.byteLength, 0)
  const result = new Uint8Array(totalLength)

  let offset = 0
  for (const chunk of chunks) {
    result.set(new Uint8Array(chunk), offset)
    offset += chunk.byteLength
  }

  console.log("Download complete")
  return result
}
