import { useSyncExternalStore } from 'react'
import { subW3, getW3 } from '../../w3'

export function getW3Error(){
  return useSyncExternalStore(subW3.error, getW3.error, getW3.error)
}