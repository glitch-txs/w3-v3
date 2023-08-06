import React from 'react'
import s from '../styles/Home.module.css'
import { disconnectW3 } from '@/libs/w3'
import { getW3Address } from '@/libs/web3modal-react'
import { openAccount, openModal } from '@/libs/web3modal-react/init'

export default function Connect() {

  const address = getW3Address()

  return (
    <>  { address ?
        <>
          <button className={s.button} onClick={openAccount}>{address}</button>
          <button className={s.button} onClick={() => disconnectW3()}>Disconnect</button>
        </> : (
        <button className={s.button} onClick={openModal}>Connect Wallet</button>
      )}
    </>
  )
}