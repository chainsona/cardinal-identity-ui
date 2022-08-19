import type { Connection, PublicKey } from '@solana/web3.js'
import { useQuery } from 'react-query'

import { useWalletIdentity } from '../providers/WalletIdentityProvider'
import { getImageUrl } from '../utils/profileImage'
import { tracer, withTrace } from '../utils/trace'
import { useAddressName } from './useAddressName'

export const useAddressImage = (
  connection: Connection,
  address: PublicKey | undefined,
  namespaceNames?: string[]
) => {
  const { dev } = useWalletIdentity()
  const addressName = useAddressName(connection, address, namespaceNames)
  return useQuery<[string, string] | undefined>(
    ['useAddressImage', address?.toString(), addressName.data],
    async () => {
      if (addressName.data) {
        const [reverseEntryName, reverseEntryNamespaceName] = addressName.data
        const imageUrl = await withTrace(
          () => getImageUrl(reverseEntryNamespaceName, reverseEntryName, dev),
          tracer({ name: 'useAddressImage' })
        )
        console.log('imageUrl', imageUrl)
        return imageUrl ? [imageUrl, addressName.data[1]] : undefined
      }
    },
    {
      enabled: addressName.isFetched,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  )
}
