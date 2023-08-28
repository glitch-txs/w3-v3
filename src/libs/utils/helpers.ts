import type { CaipNetwork } from '@web3modal/scaffold'
import { NAMESPACE } from './constants'
import { NetworkImageIds } from './presets'
import { Chain } from 'w3-evm'

export function getCaipDefaultChain(chain?: Chain) {
  if (!chain) {
    return undefined
  }

  return {
    id: `${NAMESPACE}:${chain.chainId}`,
    name: chain.chainName,
    imageId: NetworkImageIds[chain.chainId]
  } as CaipNetwork
}
