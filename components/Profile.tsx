import { contrastColorMode } from '@cardinal/common'
import { css } from '@emotion/react'
import type { Wallet } from '@saberhq/solana-contrib'
import { useWallet } from '@solana/wallet-adapter-react'
import type { PublicKey } from '@solana/web3.js'
import { Connection } from '@solana/web3.js'
import { notify } from 'common/Notification'
import {
  ConnectButton,
  DisplayAddress,
  useAddressImage,
  useAddressName,
  useWalletIdentity,
} from 'lib/src'
import { ButtonLight } from 'lib/src/common/Button'
import { IDENTITIES, isKnownIdentity } from 'lib/src/common/Identities'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { FaShare, FaUserAlt } from 'react-icons/fa'

import { AddressLink } from './AddressLink'
import { Alert } from './Alert'

interface Props {
  address: PublicKey
}

export const Profile: React.FC<Props> = ({ address }: Props) => {
  const { identities, show } = useWalletIdentity()
  const identity = identities.length === 1 ? identities[0] : undefined
  const wallet = useWallet()
  const { connection, environment } = useEnvironmentCtx()
  const addressStr = address.toString()
  const addressName = useAddressName(
    connection,
    address,
    identity?.name ? [identity.name] : undefined
  )
  const addressImage = useAddressImage(
    connection,
    address,
    identity?.name ? [identity.name] : undefined
  )

  return (
    <div
      className="rounded-2xl bg-light-0 p-6"
      style={{
        boxShadow: '0 4px 34px rgb(0 0 0 / 30%)',
        background: identity?.colors.secondary,
      }}
    >
      <div className="mb-8">
        {!addressName.isFetched ? (
          <Alert message={'Loading'} type="warning" />
        ) : addressName.data ? (
          <Alert
            message={`Succesfully linked ${addressName.data[1]}`}
            type="success"
          />
        ) : (
          <Alert
            message={`${identity?.displayName ?? 'Identity'} not linked`}
            type="warning"
          />
        )}
      </div>
      <div className="flex flex-col items-center gap-4">
        {!addressImage.isFetched ? (
          <div
            className="animate-pulse bg-gray-200"
            style={{ height: '156px', width: '156px', borderRadius: '50%' }}
          />
        ) : addressImage.data ? (
          <div
            className="relative flex items-center justify-center rounded-full"
            style={{
              height: '156px',
              width: '156px',
              padding: '5px',
              background: `${
                identity?.colors.primary ??
                (addressImage.data[1] &&
                  isKnownIdentity(addressImage.data[1]) &&
                  IDENTITIES[addressImage.data[1]].colors.primary)
              }`,
            }}
          >
            <img
              className="rounded-full"
              style={{
                height: '150px',
                width: '150px',
                border: '4px solid white',
                backgroundColor: '#fff',
              }}
              alt={`profile-${addressStr}`}
              src={addressImage.data[0]}
            />
            <div
              css={css`
                &:hover {
                  transform: scale(1.05);
                }
              `}
              className="absolute -right-3 -bottom-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-border text-xs"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                notify({
                  message: 'Share link copied',
                })
              }}
              style={{
                color: 'rgb(101,119,134,1)',
                background: 'rgba(100,116,139,0.1)',
              }}
            >
              <FaShare />
            </div>
          </div>
        ) : (
          <div
            className="flex items-center justify-center rounded-full p-[10px] text-light-0"
            style={{
              height: '156px',
              width: '156px',
              background: '#DDD',
              boxShadow: '0 5px 10px 0 rgb(97 83 202 / 30%)',
            }}
          >
            <FaUserAlt style={{ fontSize: '100px' }} />
          </div>
        )}
        <div className="flex flex-col justify-center text-center">
          <DisplayAddress
            size={16}
            connection={connection}
            dark={
              identity?.colors.buttonColor
                ? contrastColorMode(identity?.colors.buttonColor)[1]
                  ? true
                  : false
                : undefined
            }
            address={address}
          />
          <AddressLink address={address} />
        </div>
        {identity && (
          <div className="mt-5">
            <ConnectButton
              disabled={address?.toString() !== wallet?.publicKey?.toString()}
              dev={environment.label === 'devnet'}
              wallet={wallet as Wallet}
              connection={connection}
              secondaryConnection={
                environment.secondary
                  ? new Connection(environment.secondary)
                  : connection
              }
              onClose={addressName.refetch}
              cluster={environment.label}
            />
          </div>
        )}
        <ButtonLight
          disabled={address?.toString() !== wallet?.publicKey?.toString()}
          onClick={() =>
            address?.toString() === wallet?.publicKey?.toString() &&
            show({
              wallet: wallet as Wallet,
              connection: connection,
              cluster: environment.label,
              secondaryConnection: environment.secondary
                ? new Connection(environment.secondary)
                : connection,
              dev: environment.label === 'devnet',
            })
          }
          background={identity?.colors.buttonColor}
        >
          Manage Profiles
        </ButtonLight>
      </div>
    </div>
  )
}

export const PlaceholderProfile: React.FC = () => {
  return (
    <div
      className="rounded-2xl bg-light-0 p-6"
      style={{
        boxShadow: '0 4px 34px rgb(0 0 0 / 8%)',
      }}
    >
      <div className="mb-8">
        <Alert message={'Connect wallet to continue'} type="warning" />
      </div>
      <div className="flex flex-col items-center justify-center">
        <div
          className="animate-pulse rounded-full bg-gray-200"
          style={{
            height: '156px',
            width: '156px',
            marginBottom: '15px',
          }}
        />
        <div
          style={{ marginBottom: '5px' }}
          className="h-6 w-32 animate-pulse rounded-md bg-gray-200"
        />
        <div
          style={{ marginBottom: '33px' }}
          className="h-6 w-28 animate-pulse rounded-md bg-gray-200"
        />
      </div>
    </div>
  )
}
