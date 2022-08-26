import { contrastColorMode } from '@cardinal/common'
import { css } from '@emotion/react'
import { darken, lighten } from 'polished'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  disabled?: boolean
  background?: string
}

export const ButtonLight: React.FC<Props> = ({
  children,
  className,
  disabled,
  background,
  ...props
}: Props) => {
  return (
    <div
      className={`flex items-center justify-center rounded-[5px] bg-[#EEE] px-2 py-1 text-center text-xs text-light-4 transition-all duration-300 hover:bg-[#DDD] ${className} ${
        disabled ? 'cursor-default opacity-50' : 'cursor-pointer'
      }`}
      {...props}
      css={
        background &&
        css`
          background: ${background} !important;
          color: ${contrastColorMode(background)[1]
            ? lighten(0.5, background)
            : darken(0.5, background)} !important;
          &:hover {
            background: ${contrastColorMode(background)[1]
              ? lighten(0.05, background)
              : darken(0.05, background)} !important;
          }
        `
      }
    >
      <>{children}</>
    </div>
  )
}
