import React from 'react'
import { disconnectW3, getW3Address, useConnect } from 'w3-evm-react'
import { Web3Modal } from '../lib/client'
import s from '../styles/Home.module.css'

// 3. Create Web3Modal
const modal = new Web3Modal({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID as string })

export default function Connect() {
  
  async function openModal() {
    await modal.open()
  }
  const address = getW3Address()

  return (
    <>  { address ?
        <>
          <button className={s.button} onClick={openModal}>{address}</button>
          <button className={s.button} onClick={() => disconnectW3()}>Disconnect</button>
        </> : (
        <button className={s.button} onClick={openModal}>Connect Wallet</button>
      )}
    </>
  )
}