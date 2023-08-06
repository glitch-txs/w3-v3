import { useEffect } from 'react'
import { Connector } from '../w3/types'
import { KEY_WALLET } from '../w3/constants'
import { initEIP6963, storedWalletExists } from '../w3/functions'
import { setW3 } from '../w3/store/w3store'

let init = 0

export function W3({ connectors }:{ connectors?: Connector[] }):null{

  useEffect(()=>{
    if(init === 0 && connectors){
      initEIP6963()
      for(let w of connectors) w.init()
      
      if(!localStorage.getItem(KEY_WALLET)){
        setW3.wait(undefined)
      }else{
        setTimeout(storedWalletExists, 600)
      }
    }

    // This component must be mounted only once in the whole application's lifecycle
    return ()=>{init = 1}
  },[])

  return null
}