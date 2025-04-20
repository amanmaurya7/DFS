import * as sodium from "libsodium-wrappers"

/**
 * Generates a key pair for asymmetric encryption
 * @returns Public and private keys
 */
export async function generateKeyPair() {
  await sodium.ready
  const keyPair = sodium.crypto_box_keypair()

  return {
    publicKey: sodium.to_base64(keyPair.publicKey),
    privateKey: sodium.to_base64(keyPair.privateKey),
  }
}

/**
 * Encrypts a symmetric key with the recipient's public key
 * @param symmetricKey The symmetric key used to encrypt the file
 * @param recipientPublicKey The recipient's public key
 * @returns Encrypted key that only the recipient can decrypt
 */
export async function encryptKeyForRecipient(symmetricKey: string, recipientPublicKey: string): Promise<string> {
  await sodium.ready

  // Convert from base64
  const keyBytes = sodium.from_base64(symmetricKey)
  const publicKeyBytes = sodium.from_base64(recipientPublicKey)

  // Generate a random nonce
  const nonce = sodium.randombytes_buf(sodium.crypto_box_NONCEBYTES)

  // Get sender's keypair
  const senderKeypair = sodium.crypto_box_keypair()

  // Encrypt the symmetric key
  const encryptedKey = sodium.crypto_box_easy(keyBytes, nonce, publicKeyBytes, senderKeypair.privateKey)

  // Combine nonce, sender's public key, and encrypted key
  const result = new Uint8Array(nonce.length + senderKeypair.publicKey.length + encryptedKey.length)
  result.set(nonce)
  result.set(senderKeypair.publicKey, nonce.length)
  result.set(encryptedKey, nonce.length + senderKeypair.publicKey.length)

  // Return as base64
  return sodium.to_base64(result)
}

/**
 * Decrypts a symmetric key that was encrypted with the recipient's public key
 * @param encryptedKey The encrypted symmetric key
 * @param privateKey The recipient's private key
 * @returns The decrypted symmetric key
 */
export async function decryptKeyWithPrivateKey(encryptedKey: string, privateKey: string): Promise<string> {
  await sodium.ready

  // Convert from base64
  const encryptedKeyBytes = sodium.from_base64(encryptedKey)
  const privateKeyBytes = sodium.from_base64(privateKey)

  // Extract nonce, sender's public key, and encrypted data
  const nonce = encryptedKeyBytes.slice(0, sodium.crypto_box_NONCEBYTES)
  const senderPublicKey = encryptedKeyBytes.slice(
    sodium.crypto_box_NONCEBYTES,
    sodium.crypto_box_NONCEBYTES + sodium.crypto_box_PUBLICKEYBYTES,
  )
  const ciphertext = encryptedKeyBytes.slice(sodium.crypto_box_NONCEBYTES + sodium.crypto_box_PUBLICKEYBYTES)

  // Decrypt the symmetric key
  const decryptedKey = sodium.crypto_box_open_easy(ciphertext, nonce, senderPublicKey, privateKeyBytes)

  // Return as base64
  return sodium.to_base64(decryptedKey)
}
