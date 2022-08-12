import type { CertificateData } from '@cardinal/certificates'
import type { AccountData } from '@cardinal/common'
import type { TokenManagerData } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type * as metaplex from '@metaplex-foundation/mpl-token-metadata'
import type { Wallet } from '@saberhq/solana-contrib'
import type { Cluster, Connection, PublicKey } from '@solana/web3.js'
import { sendAndConfirmRawTransaction, Transaction } from '@solana/web3.js'
import { useMutation, useQueryClient } from 'react-query'

import { apiBase } from '../utils/constants'
import { tracer, withTrace } from '../utils/trace'

export interface HandleSetParam {
  metaplexData?: {
    pubkey: PublicKey
    parsed: metaplex.MetadataData
  } | null
  tokenManager?: AccountData<TokenManagerData>
  certificate?: AccountData<CertificateData> | null
}

export const useHandleClaimTransaction = (
  connection: Connection,
  wallet: Wallet,
  cluster: Cluster
) => {
  const queryClient = useQueryClient()
  return useMutation(
    [wallet.publicKey.toString()],
    async ({
      tweetId,
      handle,
    }: {
      tweetId?: string
      handle?: string
    }): Promise<string> => {
      const trace = tracer({ name: 'useHandleClaim' })
      const transactions = await withTrace(
        () => handleClaim(wallet, cluster, handle, tweetId),
        trace,
        { op: 'handleClaim' }
      )
      if (!transactions) return ''
      let txId = ''
      await wallet.signAllTransactions(transactions)
      for (const tx of transactions) {
        txId = await withTrace(
          () =>
            sendAndConfirmRawTransaction(connection, tx.serialize(), {
              skipPreflight: true,
            }),
          trace,
          { op: 'sendTransaction' }
        )
      }
      trace?.finish()
      return txId
    },
    {
      onSuccess: () => queryClient.invalidateQueries(),
    }
  )
}

export async function handleClaim(
  wallet: Wallet,
  cluster: Cluster,
  handle: string | undefined,
  tweetId: string | undefined
): Promise<Transaction[] | null> {
  if (!handle || !tweetId) return null
  const response = await fetch(
    `${apiBase(
      cluster === 'devnet'
    )}/namespaces/twitter/claim?tweetId=${tweetId}&publicKey=${wallet?.publicKey.toString()}&handle=${handle}&namespace=twitter${
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
  const transactions = json.transactions as string[]
  return transactions.map((tx) =>
    Transaction.from(Buffer.from(decodeURIComponent(tx), 'base64'))
  )
}
