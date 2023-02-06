import type { AccountData, CertificateData } from '@cardinal/certificates'
import { certificateIdForMint, getCertificate } from '@cardinal/certificates'
import { tryGetAccount } from '@cardinal/common'
import type { EntryData } from '@cardinal/namespaces'
import { getNameEntry, NAMESPACES_PROGRAM_ID } from '@cardinal/namespaces'
import * as metaplex from '@metaplex-foundation/mpl-token-metadata'
import * as splToken from '@solana/spl-token'
import type { Connection, TokenAccountBalancePair } from '@solana/web3.js'
import { PublicKey } from '@solana/web3.js'
import { useQuery } from 'react-query'

import { tracer, withTrace } from '../utils/trace'

export type NameEntryData = {
  nameEntry: AccountData<EntryData>
  certificate?: AccountData<CertificateData>
  metaplexData?: AccountData<metaplex.MetadataData>
  largestHolders: TokenAccountBalancePair[]
  owner: PublicKey | undefined
  isOwnerPDA: boolean
}

export async function getNameEntryData(
  connection: Connection,
  namespaceName: string,
  entryName: string
): Promise<NameEntryData> {
  const trace = tracer({ name: 'getNameEntryData' })
  const nameEntry = await withTrace(
    () => getNameEntry(connection, namespaceName, entryName),
    trace,
    { op: 'getNameEntry' }
  )
  const { mint } = nameEntry.parsed

  const [[metaplexId], [certificateId]] = await withTrace(
    () =>
      Promise.all([
        metaplex.MetadataProgram.findMetadataAccount(new PublicKey(mint)),
        certificateIdForMint(mint),
      ]),
    trace,
    { op: 'collectIds' }
  )
  const [metaplexData, certificate] = await withTrace(
    () =>
      Promise.all([
        metaplex.Metadata.load(connection, metaplexId),
        tryGetAccount(() => getCertificate(connection, certificateId)),
      ]),
    trace,
    { op: 'getAccounts' }
  )
  const largestHolders = await withTrace(
    () => connection.getTokenLargestAccounts(mint),
    trace,
    { op: 'getTokenLargestAccounts' }
  )
  let largestTokenAccount: splToken.Account | undefined
  const largestHolder = largestHolders?.value[0]?.address
  if (largestHolder) {
    largestTokenAccount = await withTrace(
      () => splToken.getAccount(connection, largestHolder),
      trace,
      { op: 'getTokenAccount' }
    )
  }
  let isOwnerPDA = false
  const largestTokenAccountOnwer = largestTokenAccount?.owner
  if (largestTokenAccountOnwer) {
    const ownerAccountInfo = await withTrace(
      () => connection.getAccountInfo(largestTokenAccountOnwer),
      trace,
      { op: 'checkOwner' }
    )
    isOwnerPDA =
      ownerAccountInfo?.owner.toString() === NAMESPACES_PROGRAM_ID.toString()
  }

  return {
    nameEntry,
    certificate: certificate ?? undefined,
    metaplexData: { pubkey: metaplexData.pubkey, parsed: metaplexData.data },
    largestHolders: largestHolders.value,
    owner: largestTokenAccount?.owner,
    isOwnerPDA,
  }
}

export const useNameEntryData = (
  connection: Connection | undefined,
  namespaceName: string,
  entryName: string | undefined
) => {
  return useQuery<NameEntryData | undefined>(
    ['useNameEntryData', namespaceName, entryName],
    async () => {
      if (!entryName || !connection) return
      return getNameEntryData(connection, namespaceName, entryName)
    },
    {
      enabled: !!entryName && !!connection,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  )
}
