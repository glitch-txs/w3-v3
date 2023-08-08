import React from 'react'
import { disconnectW3 } from '@/libs/w3'
import { getW3Address, openAccount, openModal } from '@/libs/web3modal-react'
import Sign from './Sign'

export default function Connect() {

  const address = getW3Address()

  return (
    <>  { address ?
        <>
          <button onClick={openAccount}>{address}</button>
          <button onClick={disconnectW3}>Disconnect</button>
          <Sign/>
        </> : (
        <button onClick={openModal}>Connect Wallet</button>
      )}
    </>
  )
}