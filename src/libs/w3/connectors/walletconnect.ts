import { QrModalOptions } from "@walletconnect/ethereum-provider/dist/types/EthereumProvider"
import { Provider } from "../types"
import {  KEY_WALLET } from "../constants"
import { Injected } from "./injected"
import { getW3, setW3 } from "../store/w3store"
import { catchError } from "../utils"

type WalletConnectOptions = {
  showQrModal?: boolean, qrModalOptions?: QrModalOptions, icon?: any
}
export class WalletConnect extends Injected {
  readonly id: string
  readonly name: string
  readonly icon?: any
  private provider?: Provider
  private options: WalletConnectOptions
  getProvider:()=>Promise<Provider> | Provider | undefined

  constructor(options?: WalletConnectOptions){
    const getProvider = ()=>{
      return this.provider
    }

    super()

    this.id = "walletConnect"
    this.name = 'WalletConnect'
    this.icon = options?.icon
    this.options = options  ?? {}
    this.getProvider = getProvider
  }

  async init(){
    const { EthereumProvider, OPTIONAL_METHODS, OPTIONAL_EVENTS } = await import("@walletconnect/ethereum-provider")

    const { showQrModal, qrModalOptions } = this.options
  
    const projectId = getW3.projectId()
    if(!projectId) throw new Error('Project ID Missing')

    const provider = await EthereumProvider.init({
      projectId,
      chains: [Number(getW3.chains()[0]?.chainId)],
      optionalChains: getW3.chains().map(chain => Number(chain.chainId)),
      showQrModal:showQrModal ?? false,
      qrModalOptions,
      optionalMethods:OPTIONAL_METHODS,
      optionalEvents:OPTIONAL_EVENTS,
    }).catch(catchError)
  
    if(!provider) throw new Error('Failed to initialize WalletConnect - Error not caught')

    this.provider = provider as Provider
    
    provider.on("disconnect", () => {
      if(localStorage.getItem(KEY_WALLET) === this.id) localStorage.removeItem(KEY_WALLET)
      setW3.address(undefined), setW3.chainId(undefined), setW3.walletProvider(undefined)
    });

    provider.on('display_uri', setW3.uri)
  
    if(provider.session){    
      const connected = await this.setAccountAndChainId(provider as Provider)
      if(connected) {
        console.log("hello", connected)
        if(localStorage.getItem(KEY_WALLET) !== this.id) localStorage.setItem(KEY_WALLET, this.id)
        setW3.walletProvider(provider as Provider), setW3.wait(undefined)
      return
      }
    }
    window?.dispatchEvent(new Event('WalletConnect#ready', {bubbles: true}))
  }

  async connect(){
    const provider = await this.getProvider()
    if(!provider){
      window.addEventListener('WalletConnect#ready', this.connect)
      return
    }
    window.removeEventListener('WalletConnect#ready', this.connect)
    
    setW3.wait('Connecting')
    
    await provider.connect?.()
    .catch(catchError)
    
    const connected = await this.setAccountAndChainId(this.provider)
    if(connected) {
      setW3.walletProvider(provider as Provider)
      localStorage.setItem(KEY_WALLET,this.id)
    }

    setW3.wait(undefined)
  }

  async disconnect() {
    setW3.wait('Disconnecting')
    const provider = await this.getProvider()
    console.log(provider)
    await provider?.disconnect?.()
    localStorage.removeItem(KEY_WALLET)
    setW3.address(undefined), setW3.chainId(undefined)
    setW3.walletProvider(undefined), setW3.wait(undefined)
  }
}