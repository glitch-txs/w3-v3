import React from 'react'
import s from '../styles/Home.module.css'
import { getW3Address } from '@/libs/w3-react'
import { disconnectW3 } from '@/libs/w3'
import { openWeb3Modal } from '@/libs/w3-react/store'

export default function Connect() {
  
  async function openModalAccount() {
    await openWeb3Modal({view: 'Account'})
  }

  const address = getW3Address()

  return (
    <>  { address ?
        <>
          <button className={s.button} onClick={openModalAccount}>{address}</button>
          <button className={s.button} onClick={() => disconnectW3()}>Disconnect</button>
        </> : (
        <button className={s.button} onClick={()=>openWeb3Modal()}>Connect Wallet</button>
      )}
    </>
  )
}