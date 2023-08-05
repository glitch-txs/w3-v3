import React from 'react'
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { WalletConnect, WindowEthereum, initW3, mainnet } from '@/libs/w3'
import { W3 } from '@/libs/w3-react'

const w3props = initW3({
  connectors: [new WindowEthereum(), new WalletConnect({
    projectId: process.env.NEXT_PUBLIC_PROJECT_ID as string
  })],
  chains:[mainnet]
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <W3 {...w3props} />
      <Component {...pageProps} />
    </>
  )
}
