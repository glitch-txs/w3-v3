import { Chain } from "../w3";

export const fantom: Chain = {
  chainName: 'Fantom',
  chainId:'0xfa',
  nativeCurrency:{
    name: 'FTM',
    symbol: 'FTM',
    decimals: 18,
  },
  rpcUrls:['https://rpc.ankr.com/fantom/'],
  blockExplorerUrls:['https://ftmscan.com/'],
  iconUrls:['']
}