import type { CertificateData } from '@cardinal/certificates'
import type { AccountData } from '@cardinal/common'
import {
  withSetGlobalReverseEntry,
  withSetNamespaceReverseEntry,
} from '@cardinal/namespaces'
import type { TokenManagerData } from '@cardinal/token-manager/dist/cjs/programs/tokenManager'
import type * as metaplex from '@metaplex-foundation/mpl-token-metadata'
import type { Wallet } from '@saberhq/solana-contrib'
import { Connection, Keypair } from '@solana/web3.js'
import {
  PublicKey,
  sendAndConfirmRawTransaction,
  Transaction,
} from '@solana/web3.js'
import { useMutation } from 'react-query'

import { nameFromMint } from '../components/NameManager'
import { useGlobalReverseEntry } from '../hooks/useGlobalReverseEntry'
import { handleMigrate } from './handleMigrate'

export interface HandleSetParam {
  metaplexData?: AccountData<metaplex.MetadataData>
  tokenManager?: AccountData<TokenManagerData>
  certificate?: AccountData<CertificateData> | null
}

export const useHandleSetNamespaceDefault = (
  connection: Connection,
  wallet: Wallet,
  namespaceName: string,
  cluster = 'mainnet'
) => {
  const globalReverseEntry = useGlobalReverseEntry(
    connection,
    namespaceName,
    wallet?.publicKey
  )

  return useMutation(
    async ({ tokenData }: { tokenData?: HandleSetParam }): Promise<string> => {
      if (!tokenData) return ''
      let newMintId: PublicKey | undefined
      let transactions: Transaction[] = []
      const entryMint = new PublicKey(tokenData.metaplexData?.parsed.mint!)
      const [, entryName] = nameFromMint(
        tokenData.metaplexData?.parsed.data.name || '',
        tokenData.metaplexData?.parsed.data.uri || ''
      )

      if (tokenData.certificate) {
        console.log('Type certificate, migrating ...')
        const response = await handleMigrate(wallet, entryName, cluster)
        newMintId = response?.mintId
        transactions = response?.transactions || []
        console.log('Added migration instruction')
      }

      const transaction = new Transaction()
      await withSetNamespaceReverseEntry(
        transaction,
        connection,
        wallet,
        namespaceName,
        entryName,
        newMintId || entryMint
      )

      if (
        globalReverseEntry.data &&
        globalReverseEntry.data.parsed.namespaceName === namespaceName
      ) {
        await withSetGlobalReverseEntry(transaction, connection, wallet, {
          namespaceName: namespaceName,
          entryName: entryName,
          mintId: newMintId || entryMint,
        })
      }
      transaction.feePayer = wallet.publicKey
      transaction.recentBlockhash = (
        await connection.getRecentBlockhash('max')
      ).blockhash
      transactions.push(transaction)

      let txId = ''
      await wallet.signAllTransactions(transactions)
      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i]!
        const id = await sendAndConfirmRawTransaction(
          connection,
          tx.serialize(),
          {
            skipPreflight: true,
          }
        )
        if (i === transactions.length - 1) {
          txId = id
        }
      }
      return txId
    }
  )
}
