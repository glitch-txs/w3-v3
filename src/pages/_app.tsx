import React from 'react'
import '../styles/globals.css'
import type { AppProps } from 'next/app'

import { W3, initW3, Injected } from 'w3-evm-react'
import { WalletConnect } from 'w3-evm-walletconnect'
import { createWeb3Modal } from '@/libs'

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string

const w3props = initW3({
  connectors: [
    new Injected(),
    new Injected({ id:"hello", name: "Hello Wallet" }),
    new WalletConnect({
      projectId,
      optionalChains:[1, 137]
    })
  ],
  defaultChain: 1, // Optional
  SSR: true, // Optional - For SSR Frameworks like Next.js
})

createWeb3Modal({ projectId })

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <W3 {...w3props} /> { /* Required when SSR: true */ }
      <Component {...pageProps} />
    </>
  )
}
