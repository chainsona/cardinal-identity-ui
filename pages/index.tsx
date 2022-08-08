import styled from '@emotion/styled'
import { useWallet } from '@solana/wallet-adapter-react'
import { Header } from 'common/Header'
import { PlaceholderProfile } from 'components/Profile'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export const TwitterBackground = styled.div`
  z-index: -1;
  top: 0;
  width: 100%;
  height: 100%;
  position: fixed;
  background: #1da1f2;
  //   background: linear-gradient(-45deg, #23a6d5, #1da1f2);
`

const TwitterHome = () => {
  const wallet = useWallet()
  const router = useRouter()
  const dev = router.query['cluster'] === 'devnet'

  useEffect(() => {
    if (wallet.connected) {
      router.push(
        `/${wallet?.publicKey?.toString()}${dev ? '?cluster=devnet' : ''}`,
        undefined,
        {
          shallow: true,
        }
      )
    }
  }, [wallet.connected, wallet.publicKey, router])

  return (
    <>
      <Header />
      <div style={{ marginTop: '10vh' }}>
        <div
          style={{
            width: '320px',
            margin: '0px auto',
          }}
        >
          <PlaceholderProfile />
        </div>
      </div>
      <TwitterBackground />
    </>
  )
}

export default TwitterHome
