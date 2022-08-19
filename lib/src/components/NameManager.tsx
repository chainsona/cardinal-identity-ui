import type { AccountData } from '@cardinal/common'
import type { ReverseEntryData } from '@cardinal/namespaces'
import type { Wallet } from '@saberhq/solana-contrib'
import type { Connection } from '@solana/web3.js'
import { FaPlus } from 'react-icons/fa'

import { Alert } from '../common/Alert'
import { ButtonLight } from '../common/Button'
import type { Identity } from '../common/Identities'
import { useHandleSetNamespaceDefault } from '../handlers/useHandleSetNamespaceDefault'
import { useGlobalReverseEntry } from '../hooks/useGlobalReverseEntry'
import { useNamespaceReverseEntries } from '../hooks/useNamespaceReverseEntries'
import type { UserTokenData } from '../hooks/useUserNamesForNamespace'
import { useUserNamesForNamespace } from '../hooks/useUserNamesForNamespace'
import { useWalletIdentity } from '../providers/WalletIdentityProvider'
import { isReverseEntry } from '../utils/nameUtils'
import { NameEntryRow } from './NameEntryRow'
import { SetDefaultButton } from './SetDefaultButton'

export const NameManager = ({
  connection,
  wallet,
  setVerifyIdentity,
}: {
  connection: Connection
  wallet: Wallet
  setVerifyIdentity: (arg0: Identity) => void
}) => {
  const { identities, appInfo } = useWalletIdentity()
  const handleSetNamespacesDefault = useHandleSetNamespaceDefault(
    connection,
    wallet
  )
  const namespaceReverseEntries = useNamespaceReverseEntries(
    connection,
    wallet.publicKey
  )
  const userNamesForNamespace = useUserNamesForNamespace(
    connection,
    wallet.publicKey
  )
  const globalReverseEntry = useGlobalReverseEntry(connection, wallet.publicKey)

  return (
    <div>
      <div className="mb-6 text-center text-2xl text-dark-6">
        {appInfo?.name ? `${appInfo.name} uses` : 'Use'} Cardinal to manage to
        your personal <strong>Solana</strong> identity.
      </div>
      <div className="mb-10 flex flex-col gap-8">
        {identities
          .sort((identity) =>
            globalReverseEntry.data?.parsed.namespaceName === identity.name
              ? -1
              : 1
          )
          .map((identity) => (
            <div key={identity.name} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-dark-6 px-1"
                    style={{ background: identity.colors.primary }}
                  >
                    {!!identity.icon &&
                      identity.icon({ variant: 'light', className: 'w-full' })}
                  </div>
                  <div className="text-sm font-semibold text-black">
                    {identity.displayName}
                  </div>
                </div>
                <div className="flex flex-row gap-1">
                  <SetDefaultButton
                    connection={connection}
                    wallet={wallet}
                    identity={identity}
                  />
                  <ButtonLight
                    onClick={() => setVerifyIdentity(identity)}
                    className="flex flex-row items-center gap-1"
                  >
                    Add <FaPlus className="text-[10px]" />
                  </ButtonLight>
                </div>
              </div>
              <div className="my-1 h-[1px] bg-gray-200"></div>
              {!userNamesForNamespace.isFetched ||
              !globalReverseEntry.isFetched ? (
                <>
                  <div className="h-6 w-full animate-pulse rounded-lg bg-gray-200"></div>
                  <div className="h-6 w-full animate-pulse rounded-lg bg-gray-200"></div>
                </>
              ) : userNamesForNamespace.data?.filter(
                  (userTokenData) =>
                    userTokenData.identity.name === identity.name
                ).length === 0 ? (
                <div className="px-2 text-gray-400">No handles found</div>
              ) : (
                <>
                  {userNamesForNamespace.data
                    ?.filter(
                      (userTokenData) =>
                        userTokenData.identity.name === identity.name
                    )
                    ?.sort((userTokenData) =>
                      sortOnReverseEntry(
                        userTokenData,
                        globalReverseEntry.data,
                        namespaceReverseEntries.data
                      )
                    )
                    ?.map((userTokenData) => (
                      <NameEntryRow
                        key={userTokenData.tokenAccount?.pubkey.toString()}
                        namespaceName={userTokenData.identity.name}
                        connection={connection}
                        wallet={wallet}
                        userTokenData={userTokenData}
                      />
                    ))}
                </>
              )}
            </div>
          ))}
        {handleSetNamespacesDefault.error && (
          <Alert
            style={{
              marginTop: '10px',
              height: 'auto',
              wordBreak: 'break-word',
            }}
            message={
              <>
                <div>{`${handleSetNamespacesDefault.error}`}</div>
              </>
            }
            type="error"
            showIcon
          />
        )}
      </div>
    </div>
  )
}

export const sortOnReverseEntry = (
  userTokenData: UserTokenData,
  globalReverseEntry: AccountData<ReverseEntryData> | undefined,
  namespaceReverseEntry: AccountData<ReverseEntryData>[] | undefined
): number =>
  isReverseEntry(userTokenData, globalReverseEntry)
    ? -1
    : namespaceReverseEntry?.some((reverseEntry) =>
        isReverseEntry(userTokenData, reverseEntry)
      )
    ? -1
    : 1
