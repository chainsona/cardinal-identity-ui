import { AccountConnect } from '@cardinal/namespaces-components'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { GlyphWallet } from 'assets/GlyphWallet'
import { useRouter } from 'next/router'
import { useEnvironmentCtx } from 'providers/EnvironmentProvider'
import { useEffect, useState } from 'react'

import { ButtonSmall } from './ButtonSmall'
import { LogoTitled } from './LogoTitled'
import { asWallet } from './Wallets'

type Props = {
  tabs?: {
    disabled?: boolean
    name: string
    anchor: string
    tooltip?: string
  }[]
  hideDashboard?: boolean
}




export const Header: React.FC<Props> = ({ tabs, hideDashboard }: Props) => {
  const router = useRouter()
  const wallet = useWallet()
  const walletModal = useWalletModal()
  const { connection, environment } = useEnvironmentCtx()

  const [tab, setTab] = useState<string>('browse')

  useEffect(() => {
    const anchor = router.asPath.split('#')[1]
    if (anchor !== tab) setTab(anchor || 'browse')
  }, [router.asPath, tab])  

  return (
    <div className="w-full px-4 py-4">
      <div className="flex min-h-[72px] flex-wrap items-center justify-center gap-4 rounded-xl bg-white bg-opacity-5 py-4 px-8 md:justify-between">
        <div className="flex items-center gap-5">
          <div
            className="flex cursor-pointer items-center transition-opacity hover:opacity-60"
            onClick={() => {             
              router.push(`/${location.search}`)
            }}
          >
              <LogoTitled className="inline-block h-6" />
          </div>
          {environment.label !== 'mainnet-beta' && (
            <div className="text-primary">{environment.label}</div>
          )}
        </div>
        
        <div className="flex-5 flex items-center justify-end gap-6">          
          {wallet.connected && wallet.publicKey ? (
            <AccountConnect
              dark={true}
              connection={connection}
              environment={environment.label}
              handleDisconnect={() => wallet.disconnect()}
              wallet={asWallet(wallet)}
            />
          ) : (
            <ButtonSmall
              className="text-xs"
              onClick={() => walletModal.setVisible(true)}
            >
              <>
                <GlyphWallet />
                <div className="text-white">Connect wallet</div>
              </>
            </ButtonSmall>
          )}
        </div>
      </div>
    </div>
  )
}
