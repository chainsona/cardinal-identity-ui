import { getQueryParam } from '@cardinal/common'
import { breakName, formatName } from '@cardinal/namespaces'
import type { Wallet } from '@saberhq/solana-contrib'
import type { Connection } from '@solana/web3.js'
import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { AiFillStar } from 'react-icons/ai'
import { BsGlobe } from 'react-icons/bs'
import { BiUnlink } from 'react-icons/bi'

import { Alert } from '../common/Alert'
import { ButtonLight } from '../common/Button'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { useHandleSetNamespaceDefault } from '../handlers/useHandleSetNamespaceDefault'
import { useHandleSetGlobalDefault } from '../handlers/useHandleSetGlobalDefault'
import { useHandleUnlink } from '../handlers/useHandleUnlink'
import { useGlobalReverseEntry } from '../hooks/useGlobalReverseEntry'
import { useNamespaceReverseEntry } from '../hooks/useNamespaceReverseEntry'
import type { UserTokenData } from '../hooks/useUserNamesForNamespace'
import { useUserNamesForNamespace } from '../hooks/useUserNamesForNamespace'
import { formatTwitterLink } from '../utils/format'
import { BoltIcon } from './icons'
import { StepDetail } from './StepDetail'
import { Tooltip } from '../common/Tooltip'

export const nameFromMint = (name: string, uri: string): [string, string] => {
  if (uri.includes('name')) {
    return [name, getQueryParam(uri, 'name') || '']
  }
  return [breakName(name || '')[0], breakName(name || '')[1]]
}

export const NameEntryRow = ({
  cluster,
  connection,
  wallet,
  namespaceName,
  userTokenData,
  setError,
  setSuccess,
}: {
  cluster?: string
  connection: Connection
  wallet: Wallet
  namespaceName: string
  userTokenData: UserTokenData
  setError: (e: unknown) => void
  setSuccess: (e: ReactElement) => void
}) => {
  const userNamesForNamespace = useUserNamesForNamespace(
    connection,
    wallet.publicKey,
    namespaceName
  )
  const globalReverseEntry = useGlobalReverseEntry(
    connection,
    namespaceName,
    wallet.publicKey
  )
  const namespaceReverseEntry = useNamespaceReverseEntry(
    connection,
    namespaceName,
    wallet.publicKey
  )
  const handleUnlink = useHandleUnlink(
    connection,
    wallet,
    namespaceName,
    userTokenData
  )
  const handleSetNamespacesDefault = useHandleSetNamespaceDefault(
    connection,
    wallet,
    namespaceName,
    cluster
  )
  const handleSetGlobalDefault = useHandleSetGlobalDefault(
    connection,
    wallet,
    namespaceName
  )

  useEffect(() => {
    if (handleUnlink.isLoading || handleSetNamespacesDefault.isLoading) {
      setError(undefined)
    }
  }, [handleUnlink.isLoading, handleSetNamespacesDefault.isLoading])
  return (
    <div className="flex items-center justify-between gap-5 px-2">
      <div
        className="cursor-point flex cursor-pointer items-center gap-1"
        style={{ fontSize: '14px' }}
      >
        {formatTwitterLink(
          nameFromMint(
            userTokenData.metaplexData?.parsed.data.name || '',
            userTokenData.metaplexData?.parsed.data.uri || ''
          )[1]
        )}
        {globalReverseEntry.data &&
          formatName(
            namespaceName,
            globalReverseEntry.data.parsed.entryName
          ) ===
            formatName(
              ...nameFromMint(
                userTokenData.metaplexData?.parsed.data.name || '',
                userTokenData.metaplexData?.parsed.data.uri || ''
              )
            ) && <BsGlobe />}
        {namespaceReverseEntry.data &&
          formatName(
            namespaceName,
            namespaceReverseEntry.data.parsed.entryName
          ) ===
            formatName(
              ...nameFromMint(
                userTokenData.metaplexData?.parsed.data.name || '',
                userTokenData.metaplexData?.parsed.data.uri || ''
              )
            ) && <AiFillStar />}
      </div>
      <div className="flex items-center gap-2">
        {!userTokenData.certificate &&
          (!namespaceReverseEntry.data ||
            (namespaceReverseEntry.data &&
              formatName(
                namespaceName,
                namespaceReverseEntry.data.parsed.entryName
              ) !==
                formatName(
                  ...nameFromMint(
                    userTokenData.metaplexData?.parsed.data.name || '',
                    userTokenData.metaplexData?.parsed.data.uri || ''
                  )
                ))) && (
            <Tooltip title={'Set handle as you default twitter identity'}>
              <ButtonLight
                onClick={() => {
                  // set default namespace reverse entry
                  handleSetNamespacesDefault.mutate(
                    {
                      tokenData: userTokenData,
                    },
                    {
                      onSuccess: (txid) => {
                        userNamesForNamespace.remove()
                        namespaceReverseEntry.refetch()
                        globalReverseEntry.refetch()
                        setSuccess(
                          <div className="flex w-full flex-col text-center">
                            <div>
                              Succesfully set handle as default twitter
                              identity.
                            </div>
                            <div>
                              Changes will be reflected{' '}
                              <a
                                className="cursor-pointer text-blue-500"
                                target={`_blank`}
                                onClick={() =>
                                  window.open(
                                    `https://explorer.solana.com/tx/${txid}?cluster=${cluster}`
                                  )
                                }
                                href={`https://explorer.solana.com/tx/${txid}?cluster=${cluster}`}
                              >
                                shortly.
                              </a>
                            </div>
                          </div>
                        )
                      },
                      onError: (e) => setError(e),
                    }
                  )
                }}
              >
                {handleSetNamespacesDefault.isLoading ? (
                  <LoadingSpinner height="15px" fill="#000" />
                ) : (
                  <AiFillStar />
                )}
              </ButtonLight>
            </Tooltip>
          )}
        {userTokenData.certificate && (
          <Tooltip title={'Set handle as you default twitter identity'}>
            <ButtonLight
              onClick={() =>
                handleSetNamespacesDefault.mutate(
                  {
                    tokenData: userTokenData,
                  },
                  {
                    onSuccess: (txid) => {
                      userNamesForNamespace.remove()
                      namespaceReverseEntry.refetch()
                      setSuccess(
                        <div className="flex w-full flex-col text-center">
                          <div>
                            Succesfully updated handle to new identity version.
                          </div>
                          <div>
                            Changes will be reflected{' '}
                            <a
                              className="cursor-pointer text-blue-500"
                              target={`_blank`}
                              onClick={() =>
                                window.open(
                                  `https://explorer.solana.com/tx/${txid}?cluster=${cluster}`
                                )
                              }
                              href={`https://explorer.solana.com/tx/${txid}?cluster=${cluster}`}
                            >
                              shortly.
                            </a>
                          </div>
                        </div>
                      )
                    },
                    onError: (e) => setError(e),
                  }
                )
              }
            >
              {handleSetNamespacesDefault.isLoading ? (
                <LoadingSpinner height="15px" fill="#000" />
              ) : (
                <AiFillStar />
              )}
            </ButtonLight>
          </Tooltip>
        )}
        <Tooltip title={'Unlink Handle'}>
          <ButtonLight
            className="flex items-center gap-1"
            onClick={async () =>
              handleUnlink.mutate(
                {
                  globalReverseNameEntryData:
                    globalReverseEntry.data &&
                    formatName(
                      namespaceName,
                      globalReverseEntry.data.parsed.entryName
                    ) ===
                      formatName(
                        ...nameFromMint(
                          userTokenData.metaplexData?.parsed.data.name || '',
                          userTokenData.metaplexData?.parsed.data.uri || ''
                        )
                      )
                      ? globalReverseEntry.data
                      : undefined,
                  namespaceReverseEntry:
                    namespaceReverseEntry.data &&
                    formatName(
                      namespaceName,
                      namespaceReverseEntry.data.parsed.entryName
                    ) ===
                      formatName(
                        ...nameFromMint(
                          userTokenData.metaplexData?.parsed.data.name || '',
                          userTokenData.metaplexData?.parsed.data.uri || ''
                        )
                      )
                      ? namespaceReverseEntry.data
                      : undefined,
                },
                {
                  onSuccess: (txid) => {
                    userNamesForNamespace.remove()
                    globalReverseEntry.refetch()
                    setSuccess(
                      <div className="flex w-full flex-col text-center">
                        <div>
                          Succesfully unlinked{' '}
                          {formatTwitterLink(
                            nameFromMint(
                              userTokenData.metaplexData?.parsed.data.name ||
                                '',
                              userTokenData.metaplexData?.parsed.data.uri || ''
                            )[1]
                          )}
                          .
                        </div>
                        <div>
                          Changes will be reflected{' '}
                          <a
                            className="cursor-pointer text-blue-500"
                            target={`_blank`}
                            onClick={() =>
                              window.open(
                                `https://explorer.solana.com/tx/${txid}?cluster=${cluster}`
                              )
                            }
                            href={`https://explorer.solana.com/tx/${txid}?cluster=${cluster}`}
                          >
                            shortly.
                          </a>
                        </div>
                      </div>
                    )
                  },
                  onError: (e) => setError(e),
                }
              )
            }
          >
            {handleUnlink.isLoading ? (
              <LoadingSpinner height="15px" fill="#000" />
            ) : (
              <>
                <BiUnlink />
              </>
            )}
          </ButtonLight>
        </Tooltip>
      </div>
    </div>
  )
}

export const NameManager = ({
  connection,
  wallet,
  namespaceName,
  cluster,
}: {
  connection: Connection
  wallet: Wallet
  namespaceName: string
  cluster?: string
}) => {
  const [error, setError] = useState<unknown>()
  const [success, setSuccess] = useState<ReactElement>()
  const handleSetNamespacesDefault = useHandleSetNamespaceDefault(
    connection,
    wallet,
    namespaceName,
    cluster
  )
  const handleSetGlobalDefault = useHandleSetGlobalDefault(
    connection,
    wallet,
    namespaceName
  )
  const userNamesForNamespace = useUserNamesForNamespace(
    connection,
    wallet.publicKey,
    namespaceName
  )
  const globalReverseEntry = useGlobalReverseEntry(
    connection,
    namespaceName,
    wallet.publicKey
  )
  const namespcaeReverseEntry = useNamespaceReverseEntry(
    connection,
    namespaceName,
    wallet.publicKey
  )

  return (
    <div className="mb-10 flex flex-col gap-2">
      <StepDetail
        icon={<BoltIcon />}
        title="Manage existing handles"
        description={<></>}
      />
      <div className="my-1 h-[1px] bg-gray-200"></div>
      {!userNamesForNamespace.isFetched ||
      !globalReverseEntry.isFetched ||
      !namespcaeReverseEntry.isFetched ? (
        <>
          <div className="h-8 w-full animate-pulse rounded-lg bg-gray-200"></div>
          <div className="h-8 w-full animate-pulse rounded-lg bg-gray-200"></div>
        </>
      ) : userNamesForNamespace.data?.length === 0 ? (
        <div className="px-2 text-gray-400">No names found</div>
      ) : (
        <>
          {userNamesForNamespace.data
            ?.sort((userTokenData) =>
              (globalReverseEntry.data &&
                formatName(
                  namespaceName,
                  globalReverseEntry.data.parsed.entryName
                ) ===
                  formatName(
                    ...nameFromMint(
                      userTokenData.metaplexData?.parsed.data.name || '',
                      userTokenData.metaplexData?.parsed.data.uri || ''
                    )
                  )) ||
              (namespcaeReverseEntry.data &&
                formatName(
                  namespaceName,
                  namespcaeReverseEntry.data.parsed.entryName
                ) ===
                  formatName(
                    ...nameFromMint(
                      userTokenData.metaplexData?.parsed.data.name || '',
                      userTokenData.metaplexData?.parsed.data.uri || ''
                    )
                  ))
                ? -1
                : 1
            )
            .map((userTokenData) => (
              <NameEntryRow
                key={userTokenData.tokenAccount?.pubkey.toString()}
                connection={connection}
                wallet={wallet}
                namespaceName={namespaceName}
                userTokenData={userTokenData}
                setError={setError}
                setSuccess={setSuccess}
                cluster={cluster}
              />
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
          {handleSetGlobalDefault.error && (
            <Alert
              style={{
                marginTop: '10px',
                height: 'auto',
                wordBreak: 'break-word',
              }}
              message={
                <>
                  <div>{`${handleSetGlobalDefault.error}`}</div>
                </>
              }
              type="error"
              showIcon
            />
          )}
          {error && (
            <Alert
              style={{
                marginTop: '10px',
                height: 'auto',
                wordBreak: 'break-word',
              }}
              message={
                <>
                  <div>{`${error}`}</div>
                </>
              }
              type="error"
              showIcon
            />
          )}
          {success && (
            <Alert
              style={{
                marginTop: '10px',
                height: 'auto',
                wordBreak: 'break-word',
              }}
              message={success}
              type="success"
              showIcon
            />
          )}
        </>
      )}
    </div>
  )
}
