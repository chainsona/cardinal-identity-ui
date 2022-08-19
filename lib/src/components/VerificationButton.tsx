import type { Wallet } from '@saberhq/solana-contrib'

import { ButtonLight } from '../common/Button'
import type { Identity } from '../common/Identities'
import { useWalletIdentity } from '../providers/WalletIdentityProvider'

export const VerificationButton = ({
  wallet,
  identity,
  disabled,
  callback,
}: {
  wallet?: Wallet
  identity: Identity
  disabled: boolean
  callback?: () => void
}) => {
  const { appInfo } = useWalletIdentity()
  const link = identity.verificationUrl(wallet?.publicKey.toString(), appInfo)
  return (
    <div
      className="flex"
      onClick={() => {
        window.open(link, '_blank')
        callback && callback()
      }}
    >
      <ButtonLight
        className="mt-[5px] flex items-center justify-center gap-[5px] py-[5px] px-[14px]"
        background={identity?.colors.primary}
        disabled={disabled}
      >
        {identity && identity.icon({ variant: 'light', height: 14, width: 14 })}
        <span
          style={{ color: identity.colors.primaryFontColor, fontSize: '12px' }}
        >
          Verify
        </span>
      </ButtonLight>
    </div>
  )
}
