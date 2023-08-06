import { Chain } from "../w3";

export const bronos: Chain = {
  chainName: 'Bronos',
  chainId:'0x40F',
  nativeCurrency:{
    name: 'BRO',
    symbol: 'BRO',
    decimals: 18,
  },
  rpcUrls:['https://evm.bronos.org'],
  blockExplorerUrls:['https://broscan.bronos.org'],
  iconUrls:['']
}