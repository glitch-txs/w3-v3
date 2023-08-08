import React from 'react'
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { WalletConnect, Injected } from '@/libs/w3'
import { mainnet } from '@/libs/chains'
import { W3, initWeb3Modal } from '@/libs/web3modal-react'
import { ethersPlugin } from '@/libs/plugins/ethers'

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID as string

const w3props = initWeb3Modal({
  connectors: [new Injected(), new WalletConnect()],
  plugin: ethersPlugin,
  chains:[mainnet],
  projectId,
  SSR: true
})

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <W3 {...w3props} />
      <Component {...pageProps} />
    </>
  )
}
