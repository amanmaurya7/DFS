import * as sodium from "libsodium-wrappers"

/**
 * Encrypts a file using libsodium
 * @param file The file to encrypt
 * @returns The encrypted data and encryption key
 */
export async function encryptFile(file: File): Promise<{ encryptedData: Uint8Array; encryptionKey: string }> {
  await sodium.ready

  // Read the file as ArrayBuffer
  const fileBuffer = await file.arrayBuffer()
  const fileData = new Uint8Array(fileBuffer)

  // Generate a random key and nonce
  const key = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES)
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES)

  // Encrypt the file
  const encryptedData = sodium.crypto_secretbox_easy(fileData, nonce, key)

  // Combine nonce and encrypted data for storage
  // In a real app, you'd want to store the nonce separately or prepend it to the encrypted data
  const result = new Uint8Array(nonce.length + encryptedData.length)
  result.set(nonce)
  result.set(encryptedData, nonce.length)

  // Convert the key to a base64 string for storage
  const keyBase64 = sodium.to_base64(key)

  return {
    encryptedData: result,
    encryptionKey: keyBase64,
  }
}

/**
 * Decrypts data using libsodium
 * @param encryptedData The encrypted data with prepended nonce
 * @param keyBase64 The encryption key as a base64 string
 * @returns The decrypted data
 */
export async function decryptFile(encryptedData: Uint8Array, keyBase64: string): Promise<Uint8Array> {
  await sodium.ready

  // Extract the nonce and ciphertext
  const nonce = encryptedData.slice(0, sodium.crypto_secretbox_NONCEBYTES)
  const ciphertext = encryptedData.slice(sodium.crypto_secretbox_NONCEBYTES)

  // Convert the key from base64
  const key = sodium.from_base64(keyBase64)

  // Decrypt the data
  const decryptedData = sodium.crypto_secretbox_open_easy(ciphertext, nonce, key)

  return decryptedData
}

/**
 * Splits a file into chunks of a specified size
 * @param data The data to split
 * @param chunkSize The size of each chunk in bytes
 * @returns An array of chunks
 */
export async function chunkFile(data: Uint8Array, chunkSize: number): Promise<Uint8Array[]> {
  const chunks: Uint8Array[] = []

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize)
    chunks.push(chunk)
  }

  return chunks
}

/**
 * Reassembles chunks into a single file
 * @param chunks The chunks to reassemble
 * @returns The reassembled data
 */
export async function reassembleFile(chunks: Uint8Array[]): Promise<Uint8Array> {
  // Calculate the total size
  const totalSize = chunks.reduce((size, chunk) => size + chunk.length, 0)

  // Create a new array to hold all the data
  const result = new Uint8Array(totalSize)

  // Copy each chunk into the result
  let offset = 0
  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.length
  }

  return result
}
