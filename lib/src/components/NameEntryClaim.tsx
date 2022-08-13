import styled from '@emotion/styled'
import type { Wallet } from '@saberhq/solana-contrib'
import type { Cluster, Connection } from '@solana/web3.js'
import { useMemo, useState } from 'react'

import { Alert } from '../common/Alert'
import { useHandleClaim } from '../handlers/useHandleClaim'
import { useHandleRevoke } from '../handlers/useHandleRevoke'
import { useHandleVerify } from '../handlers/useHandleVerify'
import { useNameEntryData } from '../hooks/useNameEntryData'
import { TWITTER_NAMESPACE_NAME } from '../utils/constants'
import { formatShortAddress, formatTwitterLink } from '../utils/format'
import { ButtonWithFooter } from './ButtonWithFooter'
import { Link, Megaphone, Verified } from './icons'
import { LabeledInput } from './LabeledInput'
import { PostTweet } from './PostTweet'
import { StepDetail } from './StepDetail'
import { TwitterHandleNFT } from './TwitterHandleNFT'
import { useHandleSetNamespaceDefault } from '../handlers/useHandleSetNamespaceDefault'
import { notify } from '../common/Notification'
import { handleError } from '../utils/errors'

const handleFromTweetUrl = (raw: string | undefined): string | undefined => {
  if (!raw) return undefined
  return raw.split('/')[3]
}

const tweetIdFromTweetUrl = (raw: string | undefined): string | undefined => {
  if (!raw) return undefined
  return raw.split('/')[5]?.split('?')[0]
}

export const NameEntryClaim = ({
  dev = false,
  cluster = 'mainnet-beta',
  wallet,
  connection,
  secondaryConnection,
  namespaceName = TWITTER_NAMESPACE_NAME,
  appName,
  appTwitter,
  setShowManage,
  onComplete,
}: {
  dev?: boolean
  cluster?: Cluster
  wallet: Wallet
  connection: Connection
  secondaryConnection?: Connection
  namespaceName?: string
  appName?: string
  appTwitter?: string
  setShowManage: (m: boolean) => void
  onComplete?: (arg0: string) => void
}) => {
  const [tweetSent, setTweetSent] = useState(false)
  const [tweetUrl, setTweetUrl] = useState<string | undefined>(undefined)
  const handle = handleFromTweetUrl(tweetUrl)
  const tweetId = tweetIdFromTweetUrl(tweetUrl)
  const nameEntryData = useNameEntryData(
    secondaryConnection || connection,
    namespaceName,
    handle
  )
  const handleVerify = useHandleVerify(wallet, cluster, dev)
  const handleRevoke = useHandleRevoke(wallet, cluster, dev)
  const handleClaim = useHandleClaim(connection, wallet, cluster, dev)

  const handleSetNamespaceDefault = useHandleSetNamespaceDefault(
    connection,
    wallet,
    namespaceName,
    cluster
  )

  useMemo(() => {
    if (tweetUrl && tweetSent) {
      handleVerify.mutate(
        { tweetId, handle },
        {
          onError: (e) =>
            notify({
              message: `Failed Transaction`,
              description: e as string,
            }),
        }
      )
    }
  }, [wallet.publicKey.toString(), tweetUrl, handle, tweetSent, tweetId])

  const alreadyOwned =
    nameEntryData.data?.owner?.toString() && !nameEntryData.data?.isOwnerPDA
      ? true
      : false

  return (
    <>
      <DetailsWrapper>
        <StepDetail
          disabled={!wallet?.publicKey || !connection}
          icon={<Megaphone />}
          title="Tweet!"
          description={
            <>
              <div>Tweet your public key</div>
              <PostTweet
                wallet={wallet}
                appName={appName}
                appTwitter={appTwitter}
                disabled={false}
                callback={() => setTweetSent(true)}
                cluster={cluster}
              />
            </>
          }
        />
        <StepDetail
          disabled={!tweetSent}
          icon={<Link />}
          title="Paste the URL of the tweet"
          description={
            <div>
              <LabeledInput
                disabled={!tweetSent}
                label="Tweet"
                name="tweet"
                onChange={(e) => setTweetUrl(e.target.value)}
              />
            </div>
          }
        />
        <StepDetail
          disabled={!handle}
          icon={<Verified />}
          title="Claim your handle"
          description={
            <>
              <div>
                You will receive a non-tradeable NFT to prove you own your
                Twitter handle.
              </div>
              {handle && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    paddingTop: '20px',
                  }}
                >
                  <TwitterHandleNFT
                    handle={handle}
                    cluster={cluster}
                    dev={dev}
                  />
                  <div
                    style={{
                      padding: '10px',
                      width: 'calc(100% - 120px - 20px)',
                    }}
                  >
                    {handleVerify.isLoading ? (
                      <div className="mb-2 h-8 w-full animate-pulse rounded-lg bg-gray-200"></div>
                    ) : handleVerify.error ? (
                      <Alert
                        style={{
                          margin: '10px 0px',
                          height: 'auto',
                          wordBreak: 'break-word',
                        }}
                        message={<>{`${handleVerify.error}`}</>}
                        type="error"
                        showIcon
                      />
                    ) : (
                      <Alert
                        style={{
                          margin: '10px 0px',
                          height: 'auto',
                          wordBreak: 'break-word',
                          justifyContent: 'center',
                        }}
                        message={
                          <>
                            <div>
                              Verified ownership of {formatTwitterLink(handle)}
                            </div>
                          </>
                        }
                        type="success"
                        showIcon
                      />
                    )}
                    {nameEntryData.isFetching || handleRevoke.isLoading ? (
                      <div className="mb-2 h-8 min-w-full animate-pulse rounded-lg bg-gray-200"></div>
                    ) : (
                      alreadyOwned &&
                      handleVerify.isSuccess &&
                      !handleRevoke.isSuccess && (
                        <>
                          <Alert
                            style={{
                              marginBottom: '10px',
                              height: 'auto',
                              wordBreak: 'break-word',
                            }}
                            message={
                              <>
                                <div>
                                  Owned by{' '}
                                  {formatShortAddress(
                                    nameEntryData?.data?.owner
                                  )}
                                </div>
                              </>
                            }
                            type="warning"
                            showIcon
                          />
                          {nameEntryData?.data?.owner?.toString() ===
                          wallet?.publicKey?.toString() ? (
                            <>
                              <div>
                                You already own this handle! If you want to set
                                it as your default, visit the{' '}
                                <span
                                  className="cursor-pointer text-blue-500"
                                  onClick={() => setShowManage(true)}
                                >
                                  manage
                                </span>{' '}
                                tab.
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                If you wish to continue, you will revoke this
                                handle from them.
                              </div>
                            </>
                          )}
                          {handleRevoke.error && (
                            <Alert
                              style={{
                                marginTop: '10px',
                                height: 'auto',
                                wordBreak: 'break-word',
                              }}
                              message={
                                <>
                                  <div>{`${handleError(
                                    handleRevoke.error
                                  )}`}</div>
                                </>
                              }
                              type="error"
                              showIcon
                            />
                          )}
                        </>
                      )
                    )}
                  </div>
                </div>
              )}
            </>
          }
        />
        {handleClaim.error && (
          <Alert
            style={{
              height: 'auto',
              wordBreak: 'break-word',
            }}
            message={
              <>
                <div>{`${handleClaim.error}`}</div>
              </>
            }
            type="error"
            showIcon
          />
        )}
        {handleSetNamespaceDefault.error && (
          <Alert
            style={{
              height: 'auto',
              wordBreak: 'break-word',
            }}
            message={
              <>
                <div>{`${handleSetNamespaceDefault.error}`}</div>
              </>
            }
            type="error"
            showIcon
          />
        )}
      </DetailsWrapper>
      <ButtonWithFooter
        loading={handleClaim.isLoading || handleSetNamespaceDefault.isLoading}
        complete={handleClaim.isSuccess}
        disabled={
          !handleVerify.isSuccess ||
          tweetUrl?.length === 0 ||
          nameEntryData.isFetching ||
          nameEntryData?.data?.owner?.toString() ===
            wallet?.publicKey?.toString()
        }
        onClick={async () => {
          handleClaim.mutate(
            {
              tweetId,
              handle,
            },
            {
              onSuccess: () => {
                onComplete && onComplete(handle || '')
              },
              onError: (e) =>
                notify({
                  message: `Failed Transaction`,
                  description: e as string,
                }),
            }
          )
        }}
      >
        Claim {handle && `@${handle}`}
      </ButtonWithFooter>
    </>
  )
}

const ButtonWrapper = styled.div`
  display: flex;
  margin-top: 5px;
  justify-content: center;
`

const DetailsWrapper = styled.div`
  display: grid;
  grid-row-gap: 28px;
`
