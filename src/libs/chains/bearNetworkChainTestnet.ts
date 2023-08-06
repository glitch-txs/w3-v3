import { Chain } from "../w3";

export const bearNetworkChainTestnet: Chain = {
  chainName: 'Arbitrum One',
  chainId:'0xB767E',
  nativeCurrency:{
    name: 'tBRNKC',
    symbol: 'tBRNKC',
    decimals: 18,
  },
  rpcUrls:['https://brnkc-test.bearnetwork.net'],
  blockExplorerUrls:['https://brnktest-scan.bearnetwork.net'],
  iconUrls:['']
}