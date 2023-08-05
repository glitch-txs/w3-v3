import { Chain, getW3, setW3 } from "@/libs/w3"

/* Switch Network */
export async function switchNetwork(chain: Chain){
  const provider = getW3.walletProvider()
  
  if(!provider) {
    setW3.error(new Error('User is not connected'))
    return
  }
  await provider.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: chain.chainId }],
  }).catch(async (er: any)=>{
    if(er.code === 4902 || er?.data?.originalError?.code == 4902){
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [chain],
        })
        .catch(setW3.error)
    }
  })
}