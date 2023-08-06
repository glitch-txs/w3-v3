import { Chain } from "../w3";

export const baseGoerli: Chain = {
  chainName: 'Base Goerli',
  chainId:'0x14A33',
  nativeCurrency:{
    name: 'Base Goerli',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls:['https://goerli.base.org'],
  blockExplorerUrls:['https://goerli.basescan.org'],
  iconUrls:['']
}