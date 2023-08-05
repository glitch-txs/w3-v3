import React from 'react'
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { W3, Injected, WalletConnect, mainnet, initW3 } from 'w3-evm-react'

const w3props = initW3({
  wallets: [new Injected(), new WalletConnect({
    showQrModal: false
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
