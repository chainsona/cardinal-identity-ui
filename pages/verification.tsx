import Tooltip from '@mui/material/Tooltip'
import { Header } from 'common/Header'
import { useWalletIdentity } from 'lib/src'
import { ButtonLight } from 'lib/src/common/Button'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { IoCheckmarkCircleOutline } from 'react-icons/io5'

const Verification = () => {
  const router = useRouter()
  const { identities } = useWalletIdentity()
  const identity = identities.length === 1 ? identities[0] : undefined
  const [_tokenCode, setTokenCode] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const [linkCopied, setLinkCopied] = useState(false)

  useEffect(() => {
    const query = router.query
    if (!query.code) {
      setError('No verification code found')
    } else {
      setTokenCode(query.code.toString())
    }
  }, [])

  return (
    <div
      className={`fixed h-full w-full`}
      style={{ background: identity?.colors.primary }}
    >
      <Header />
      <div style={{ marginTop: '10vh' }}>
        <div
          style={{
            width: '380px',
            margin: '0px auto',
          }}
        >
          <div
            style={{
              padding: '1.5rem',
              borderRadius: '1rem',
              boxShadow: '0 4px 34px rgb(0 0 0 / 8%)',
              background: identity?.colors.secondary,
              color: identity?.colors.primaryFontColor,
            }}
          >
            {!error ? (
              <>
                <div className="flex flex-row justify-center text-2xl font-semibold">
                  Congrats!
                </div>
                <div className="text-md mt-2 flex flex-row justify-center text-center">
                  You have successfully verified your {identity?.displayName}{' '}
                  account
                </div>
                <div
                  className="text-md mt-5 flex flex-row justify-center rounded-lg p-5 text-center font-medium"
                  style={{ background: identity?.colors.buttonColor }}
                >
                  Copy this page&apos;s URL and paste it in the previous page to
                  claim your handle as a non-transferable Solana NFT
                </div>
                <Tooltip placement="top" title="Copy to clipboard">
                  <div className="mt-5 flex flex-row justify-center">
                    <ButtonLight
                      background={identity?.colors.primary}
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href)
                        setLinkCopied(true)
                      }}
                    >
                      {linkCopied && (
                        <IoCheckmarkCircleOutline className="text-lg" />
                      )}
                      <span
                        className="px-1"
                        style={{ color: identity?.colors.primaryFontColor }}
                      >
                        Copy URL
                      </span>
                    </ButtonLight>
                  </div>
                </Tooltip>
              </>
            ) : (
              <div className="text-md mt-28 flex flex-row justify-center text-center font-semibold">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Verification
