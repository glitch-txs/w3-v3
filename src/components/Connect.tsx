import React from 'react'
import Sign from './Sign'
import { getW3Address } from 'w3-evm-react'
import { disconnectW3 } from 'w3-evm'
import { useWeb3Modal } from '@/libs'

export default function Connect() {

  const address = getW3Address()
  const modal = useWeb3Modal()

  return (
    <>  { address ?
        <>
          <button onClick={()=>modal.open({view: 'Account'})}>{address}</button>
          <button onClick={disconnectW3}>Disconnect</button>
          <Sign/>
        </> : (
        <button onClick={()=>modal.open()}>Connect Wallet</button>
      )}
    </>
  )
}