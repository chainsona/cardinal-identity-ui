import { firstParam, shortPubKey, tryPublicKey } from '@cardinal/common'
import {
  findNamespaceId,
  getGlobalReverseNameEntry,
  getNameEntry,
  getReverseEntry,
} from '@cardinal/namespaces'
import * as canvas from '@napi-rs/canvas'
import { Connection } from '@solana/web3.js'
import { getImageUrl, IDENTITIES, isKnownIdentity } from 'lib/src'
import type { NextApiRequest, NextApiResponse } from 'next'
import { ENVIRONMENTS } from 'providers/EnvironmentProvider'

const twitterCard = async (req: NextApiRequest, res: NextApiResponse) => {
  const WIDTH = 1200
  const HEIGHT = 630
  const imageCanvas = canvas.createCanvas(WIDTH, HEIGHT)

  const dev = (req.query.dev as string) === 'true'
  let handle = (req.query.handle as string | undefined)?.replace('@', '')
  let addressId = req.query.addressId as string | undefined
  const identityName = req.query.i as string | undefined

  let identity =
    IDENTITIES[isKnownIdentity(identityName) ? identityName : 'twitter']

  if (addressId && !handle) {
    try {
      const clusterParam = req.query.cluster as string
      const foundEnvironment =
        ENVIRONMENTS.find(
          (e) => e.label === (firstParam(clusterParam) || 'mainnet')
        ) ?? ENVIRONMENTS[0]!
      const connection = new Connection(foundEnvironment?.primary)

      const tryAddress = tryPublicKey(addressId)
      if (tryAddress) {
        let reverseEntry
        if (identityName) {
          const [namespaceId] = await findNamespaceId(identity.name)
          reverseEntry = await getReverseEntry(
            connection,
            tryAddress,
            namespaceId,
            true
          )
        } else {
          reverseEntry = await getGlobalReverseNameEntry(connection, tryAddress)
        }
        handle = reverseEntry.parsed.entryName
        if (isKnownIdentity(reverseEntry.parsed.namespaceName)) {
          identity = IDENTITIES[reverseEntry.parsed.namespaceName]
        }
      } else {
        const nameEntry = await getNameEntry(
          connection,
          identity?.name,
          addressId
        )
        handle = addressId
        addressId = nameEntry.parsed.data?.toString()
      }
    } catch (e) {
      console.log(e)
    }
  }

  // draw base image
  const baseImgUri = 'https://identity.cardinal.so/assets/twitter-card.png'
  const backgroundCtx = imageCanvas.getContext('2d')
  backgroundCtx.fillStyle = 'rgba(26, 27, 32, 1)'
  backgroundCtx.fillRect(0, 0, WIDTH, HEIGHT)

  function drawCircularImage(
    ctx: canvas.SKRSContext2D,
    x: number,
    y: number,
    radius: number
  ) {
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2, true)
    ctx.closePath()
  }

  const img = await canvas.loadImage(baseImgUri)
  const imgContext = imageCanvas.getContext('2d')
  if (img.height > img.width) {
    imgContext.drawImage(img, 0, 0, WIDTH, HEIGHT)
  } else {
    imgContext.drawImage(img, 0, 0, WIDTH, HEIGHT)
  }

  const xDiff = 806

  const yDiff = 284
  const imageWidth = 182
  const imageHeight = 182

  if (handle) {
    const handleCtx = imageCanvas.getContext('2d')
    handleCtx.fillStyle = '#FFF'
    handleCtx.fillRect(xDiff - 75, yDiff + imageHeight / 2 + 20, 150, 30)
    handleCtx.font = `18px SFPro`
    handleCtx.fillStyle = '#177ddc'
    handleCtx.textAlign = 'center'
    handleCtx.textBaseline = 'middle'
    handleCtx.fillText(`@${handle}`, xDiff, yDiff + imageHeight / 2 + 35)
  }

  if (addressId) {
    const addressIdCtx = imageCanvas.getContext('2d')
    addressIdCtx.fillStyle = '#FFF'
    addressIdCtx.fillRect(
      xDiff - 75,
      yDiff + imageHeight / 2 + 20 + 28,
      150,
      30
    )
    addressIdCtx.font = `16px SFPro`
    addressIdCtx.fillStyle = '#666'
    addressIdCtx.textAlign = 'center'
    addressIdCtx.textBaseline = 'middle'
    addressIdCtx.fillText(
      shortPubKey(addressId),
      xDiff,
      yDiff + imageHeight / 2 + 35 + 28
    )
  }

  if (identity) {
    let profileImageUri
    try {
      profileImageUri = await getImageUrl(
        identity.name,
        handle ?? addressId ?? '',
        dev
      )
    } catch (e) {
      console.log(`Failed to get profile image ${e}`)
    }
    if (profileImageUri) {
      const profileImage = await canvas.loadImage(profileImageUri)
      const profileCtx = imageCanvas.getContext('2d')
      drawCircularImage(profileCtx, xDiff, yDiff, imageWidth / 2)
      profileCtx.clip()
      profileCtx.drawImage(
        profileImage,
        xDiff - imageWidth / 2,
        yDiff - imageHeight / 2,
        imageWidth,
        imageHeight
      )
    }
  }

  const buffer = imageCanvas.toBuffer('image/png')
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': buffer.length,
  })
  res.end(buffer, 'binary')
}

export default twitterCard
