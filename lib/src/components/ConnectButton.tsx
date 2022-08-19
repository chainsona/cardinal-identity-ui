import { ButtonLight } from '../common/Button'
import type { ShowParams } from '../providers/WalletIdentityProvider'
import { useWalletIdentity } from '../providers/WalletIdentityProvider'

interface Props
  extends Omit<
      React.DetailedHTMLProps<
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        HTMLButtonElement
      >,
      'onClick'
    >,
    ShowParams {
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}

export const ConnectButton: React.FC<Props> = ({
  dev,
  cluster,
  connection,
  secondaryConnection,
  wallet,
  onClose,
  disabled,
}: Props) => {
  const { show, identities } = useWalletIdentity()
  const identity = identities.length === 1 ? identities[0] : undefined
  return (
    <ButtonLight
      className="px-[14px] py-[6px]"
      background={identity?.colors.primary}
      disabled={disabled}
      onClick={() => {
        !disabled &&
          show({
            wallet,
            connection,
            cluster,
            secondaryConnection,
            dev,
            onClose,
            verifyIdentity: identity?.name,
          })
      }}
    >
      {!!identity && identity.icon({ variant: 'light', width: 14, height: 14 })}
      <span
        style={{ color: identity?.colors.primaryFontColor }}
        className="ml-2"
      >
        Link {identity?.displayName || 'profile'}
      </span>
    </ButtonLight>
  )
}
