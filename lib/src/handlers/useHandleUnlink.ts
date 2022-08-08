import { withRevokeCertificateV2 } from '@cardinal/certificates'
import { AccountData } from '@cardinal/common'
import {
  ReverseEntryData,
  withInvalidateExpiredNameEntry,
} from '@cardinal/namespaces'
import { withInvalidateExpiredReverseEntry } from '@cardinal/namespaces'
import * as namespaces from '@cardinal/namespaces'
import type { Wallet } from '@saberhq/solana-contrib'
import type { Connection } from '@solana/web3.js'
import {
  PublicKey,
  sendAndConfirmRawTransaction,
  Transaction,
} from '@solana/web3.js'
import { useMutation } from 'react-query'

import { nameFromMint } from '../components/NameManager'
import type { UserTokenData } from '../hooks/useUserNamesForNamespace'
import { withInvalidate } from '@cardinal/token-manager'

export const useHandleUnlink = (
  connection: Connection,
  wallet: Wallet,
  namespaceName: string,
  userTokenData: UserTokenData
) => {
  return useMutation(
    async ({
      globalReverseNameEntryData,
      namespaceReverseEntry,
    }: {
      globalReverseNameEntryData?: AccountData<ReverseEntryData>
      namespaceReverseEntry?: AccountData<ReverseEntryData>
    }): Promise<string> => {
      const transaction = await handleUnlink(connection, wallet, {
        namespaceName: namespaceName,
        userTokenData: userTokenData,
        globalReverseNameEntryData: globalReverseNameEntryData,
        namespaceReverseEntry: namespaceReverseEntry,
      })
      transaction.feePayer = wallet.publicKey
      transaction.recentBlockhash = (
        await connection.getRecentBlockhash('max')
      ).blockhash
      await wallet.signTransaction(transaction)
      return sendAndConfirmRawTransaction(connection, transaction.serialize(), {
        skipPreflight: true,
      })
    }
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
