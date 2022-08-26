import styled from '@emotion/styled'
import { useWallet } from '@solana/wallet-adapter-react'
import { Header } from 'common/Header'
import { PlaceholderProfile } from 'components/Profile'
import { useWalletIdentity } from 'lib/src'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export const TwitterBackground = styled.div`
  z-index: -1;
  top: 0;
  width: 100%;
  height: 100%;
  position: fixed;
  background: #1da1f2;
`

const TwitterHome = () => {
  const wallet = useWallet()
  const router = useRouter()
  const { identities } = useWalletIdentity()
  const identity = identities.length === 1 ? identities[0] : undefined
  const dev = router.query['cluster'] === 'devnet'

  useEffect(() => {
    if (wallet.connected) {
      const url = new URL(
        window.location.origin + `/${wallet?.publicKey?.toString()}`
      )
      if (dev) {
        url.searchParams.append('cluster', 'devnet')
      }
      router.push(url, undefined, {
        shallow: true,
      })
    }
  }, [wallet.connected, wallet.publicKey, router])

  return (
    <div
      className={`fixed h-full w-full bg-dark-4`}
      style={{ background: identity?.colors.primary }}
    >
      <Head>
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="twitter.cardinal.so" />
        <meta
          name="twitter:title"
          content={`Claim your ${identity?.displayName} handle on Solana!`}
        />
        <meta
          name="twitter:description"
          content={`Secure your identity on Solana by claiming your ${identity?.displayName} handle as an NFT, powered by Cardinal.`}
        />
        <meta
          name="twitter:image"
          content="https://identity.cardinal.so/assets/twitter-card.png"
        />
      </Head>
      <Header />
      <div style={{ marginTop: '10vh' }}>
        <div className="mx-auto w-80">
          <PlaceholderProfile />
        </div>
      </div>
    </div>
  )
}

export default TwitterHome
