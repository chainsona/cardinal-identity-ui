import type { Wallet } from '@saberhq/solana-contrib'
import type { Cluster, Connection } from '@solana/web3.js'
import { sendAndConfirmRawTransaction, Transaction } from '@solana/web3.js'
import { useMutation, useQueryClient } from 'react-query'

import { nameFromMint } from '../components/NameManager'
import type { UserTokenData } from '../hooks/useUserNamesForNamespace'
import { tracer, withTrace } from '../utils/trace'
import { apiBase } from '../utils/constants'

import { withRevokeCertificateV2 } from '@cardinal/certificates'
import { AccountData } from '@cardinal/common'
import {
  ReverseEntryData,
  withInvalidateExpiredNameEntry,
} from '@cardinal/namespaces'
import { withInvalidateExpiredReverseEntry } from '@cardinal/namespaces'
import * as namespaces from '@cardinal/namespaces'
import { PublicKey } from '@solana/web3.js'
import { withInvalidate } from '@cardinal/token-manager'

export const useHandleUnlink = (
  connection: Connection,
  wallet: Wallet,
  namespaceName: string,
  userTokenData: UserTokenData,
  cluster: Cluster,
  dev = false
) => {
  const queryClient = useQueryClient()
  return useMutation(
    async ({}: {}): Promise<string> => {
      const trace = tracer({ name: 'useHandleUnlink' })
      const [, entryName] = nameFromMint(
        userTokenData.metaplexData?.parsed.data.name!,
        userTokenData.metaplexData?.parsed.data.uri!
      )
      const transactions = await withTrace(
        () =>
          handleUnlinkTransaction(
            wallet,
            cluster,
            entryName,
            namespaceName,
            dev
          ),
        trace,
        { op: 'handleUnlinkTransaction' }
      )
      let txid = ''
      if (transactions) {
        await wallet.signAllTransactions(transactions)
        for (const tx of transactions) {
          txid = await withTrace(
            () =>
              sendAndConfirmRawTransaction(connection, tx.serialize(), {
                skipPreflight: true,
              }),
            trace,
            { op: 'sendTransaction' }
          )
        }
      }
      trace?.finish()
      return txid
    },
    {
      onSuccess: () => queryClient.invalidateQueries(),
    }
  )
}

export async function handleUnlinkTransaction(
  wallet: Wallet,
  cluster: Cluster,
  entryName: string,
  namespaceName: string,
  dev?: boolean
): Promise<Transaction[] | null> {
  const response = await fetch(
    `${apiBase(dev)}/namespaces/${namespaceName}/unlink?handle=${entryName}${
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

export async function handleUnlink(
  connection: Connection,
  wallet: Wallet,
  params: {
    namespaceName: string
    userTokenData: UserTokenData
    globalReverseNameEntryData?: AccountData<ReverseEntryData>
    namespaceReverseEntry?: AccountData<ReverseEntryData>
  }
): Promise<Transaction> {
  const [namespaceId] = await namespaces.findNamespaceId(params.namespaceName)
  const transaction = new Transaction()
  const entryMint = new PublicKey(
    params.userTokenData.metaplexData?.parsed.mint!
  )
  const [, entryName] = nameFromMint(
    params.userTokenData.metaplexData?.parsed.data.name!,
    params.userTokenData.metaplexData?.parsed.data.uri!
  )

  if (params.userTokenData.certificate) {
    await withRevokeCertificateV2(connection, wallet, transaction, {
      certificateMint: entryMint,
      revokeRecipient: namespaceId,
    })
  } else if (params.userTokenData.tokenManager) {
    // invalidate token manager
    await withInvalidate(transaction, connection, wallet, entryMint)
  }
  if (params.namespaceReverseEntry) {
    await withInvalidateExpiredReverseEntry(transaction, connection, wallet, {
      namespaceName: params.namespaceName,
      mintId: entryMint,
      entryName: params.namespaceReverseEntry.parsed.entryName,
      reverseEntryId: params.namespaceReverseEntry.pubkey,
    })
  }
  if (params.globalReverseNameEntryData) {
    await withInvalidateExpiredReverseEntry(transaction, connection, wallet, {
      namespaceName: params.namespaceName,
      mintId: entryMint,
      entryName: params.globalReverseNameEntryData.parsed.entryName,
      reverseEntryId: params.globalReverseNameEntryData.pubkey,
    })
  }
  await withInvalidateExpiredNameEntry(transaction, connection, wallet, {
    namespaceName: params.namespaceName,
    mintId: entryMint,
    entryName,
  })
  return transaction
}
