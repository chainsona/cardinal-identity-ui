import type { Wallet } from '@saberhq/solana-contrib'
import * as Sentry from '@sentry/browser'
import type { Cluster, Connection } from '@solana/web3.js'
import React, { useContext, useState } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'

import { ClaimCard } from '..'
import type { Identity, IdentityName } from '../common/Identities'
import { IDENTITIES } from '../common/Identities'
import { Modal } from '../common/Modal'
import { withSleep } from '../utils/transactions'

const WALLET_IDENTITY_SENTRY_DSN =
  'https://109718d85e0640f0b5f7160e2602b5f0@o1340959.ingest.sentry.io/6625303'

export type AppInfo = {
  name: string
  twitter?: string
}

export type ShowParams = {
  connection: Connection
  cluster: Cluster
  wallet: Wallet
  verifyIdentity?: IdentityName
  identities?: Identity[]
  onClose?: () => void
  secondaryConnection?: Connection
  dev?: boolean
}

export interface WalletIdentity {
  show: (arg: ShowParams) => void
  identities: Identity[]
  appInfo?: AppInfo
  handle?: string
  wallet?: Wallet
  connection?: Connection
  secondaryConnection?: Connection
  message?: React.ReactNode
  setMessage: (node: React.ReactNode) => void
  cluster?: Cluster
  dev?: boolean
  showIdentityModal: boolean
}

export const WalletIdentityContext = React.createContext<WalletIdentity | null>(
  null
)

interface Props {
  appInfo?: AppInfo
  identities?: Identity[]
  children: React.ReactNode
}

const QUERY_CLIENT = new QueryClient()

export const WalletIdentityProvider: React.FC<Props> = ({
  appInfo,
  identities: defaultIdentities = Object.values(IDENTITIES),
  children,
}: Props) => {
  const [wallet, setWallet] = useState<Wallet>()
  const [connection, setConnection] = useState<Connection>()
  const [secondaryConnection, setSecondaryConnection] = useState<Connection>()
  const [cluster, setCluster] = useState<Cluster | undefined>(undefined)
  const [dev, setDev] = useState<boolean | undefined>(undefined)
  const [onClose, setOnClose] = useState<(() => void) | undefined>()
  const [showIdentityModal, setShowIdentityModal] = useState<boolean>(false)
  const [identities, setIdentities] = useState(defaultIdentities)
  const [defaultVerifyIdentity, setDefaultVerifyIdentity] = useState<Identity>()
  const [message, setMessage] = useState<React.ReactNode>()

  Sentry.init({
    dsn: WALLET_IDENTITY_SENTRY_DSN,
    tracesSampleRate: 1.0,
  })

  return (
    <WalletIdentityContext.Provider
      value={{
        show: ({
          wallet,
          connection,
          cluster,
          secondaryConnection,
          dev,
          onClose,
          identities,
          verifyIdentity,
        }) => {
          setWallet(wallet)
          setConnection(connection)
          setCluster(cluster)
          setSecondaryConnection(secondaryConnection)
          setDev(dev)
          onClose && setOnClose(() => onClose)
          setShowIdentityModal(true)
          setMessage(undefined)
          identities && setIdentities(identities)
          verifyIdentity && setDefaultVerifyIdentity(IDENTITIES[verifyIdentity])
          Sentry.configureScope((scope) => {
            scope.setUser({
              username: wallet.publicKey?.toString(),
              wallet: wallet.publicKey?.toString(),
            })
            scope.setTag('wallet', wallet.publicKey?.toString())
          })
        },
        wallet,
        identities,
        connection,
        appInfo,
        secondaryConnection,
        cluster,
        dev,
        message,
        setMessage,
        showIdentityModal,
      }}
    >
      <QueryClientProvider client={QUERY_CLIENT}>
        <Modal
          className="bg-white text-dark-6"
          isOpen={showIdentityModal}
          onDismiss={() => {
            setShowIdentityModal(false)
            QUERY_CLIENT.invalidateQueries()
            onClose && onClose()
          }}
        >
          <ClaimCard
            wallet={wallet}
            connection={connection}
            secondaryConnection={secondaryConnection}
            defaultVerifyIdentity={defaultVerifyIdentity}
            onComplete={() => {
              withSleep(() => {
                setShowIdentityModal(false)
                onClose && onClose()
              }, 1000)
            }}
          />
        </Modal>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </WalletIdentityContext.Provider>
  )
}

export const useWalletIdentity = (): WalletIdentity => {
  const identity = useContext(WalletIdentityContext)
  if (!identity) {
    throw new Error('Not in WalletIdentity context')
  }
  return identity
}
