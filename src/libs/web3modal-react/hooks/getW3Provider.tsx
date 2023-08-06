import { useSyncExternalStore } from 'react'
import { subW3, getW3 } from '../../w3'

export function getW3Provider() {
  return useSyncExternalStore(subW3.walletProvider, getW3.walletProvider, getW3.walletProvider)
}