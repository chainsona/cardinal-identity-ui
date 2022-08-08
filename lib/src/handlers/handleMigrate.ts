import type { Wallet } from '@saberhq/solana-contrib'
import { PublicKey, Transaction } from '@solana/web3.js'

import { apiBase } from '../utils/constants'

export const handleMigrate = async (
  wallet: Wallet,
  handle: string,
  cluster = 'mainnet'
): Promise<{ mintId: PublicKey; transactions: Transaction[] } | undefined> => {
  const response = await fetch(
    `${apiBase(
      cluster === 'devnet'
    )}/twitter/migrate?publicKey=${wallet?.publicKey.toString()}&handle=${handle}&namespace=twitter${
      cluster === 'devnet' ? `&cluster=${cluster}` : ''
    }`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account: wallet.publicKey.toString(),
      }),
    }
  )
  const json = await response.json()
  if (response.status !== 200 || json.error) throw new Error(json.error)
  const { transactions, mintId } = json
  const [revokeTransaction, migrateTransaction] = transactions as string[]
  const revokeBuffer = Buffer.from(
    decodeURIComponent(revokeTransaction!),
    'base64'
  )
  const migrateBuffer = Buffer.from(
    decodeURIComponent(migrateTransaction!),
    'base64'
  )
  const revokeTx = Transaction.from(revokeBuffer)
  const migrateTx = Transaction.from(migrateBuffer)
  return { mintId: new PublicKey(mintId), transactions: [revokeTx, migrateTx] }
}
