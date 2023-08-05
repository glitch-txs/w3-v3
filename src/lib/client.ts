import type {
  CaipAddress,
  CaipNetwork,
  CaipNetworkId,
  ConnectionControllerClient,
  NetworkControllerClient
} from '@web3modal/scaffold'
import { Web3ModalScaffoldHtml } from '@web3modal/scaffold'
import { Chain, web3Store, connectW3, disconnectW3 } from 'w3-evm-react'

const { getState, subscribe } = web3Store
// -- Helpers -------------------------------------------------------------------
const WALLET_CONNECT_ID = 'walletconnect'
const NAMESPACE = 'eip155'

interface Web3ModalOptions {
  projectId: string
}
// -- Client --------------------------------------------------------------------
export class Web3Modal extends Web3ModalScaffoldHtml {
  public constructor(options: Web3ModalOptions) {
    const { projectId } = options

    if (!projectId) {
      throw new Error('web3modal:constructor - projectId is undefined')
    }

    const networkControllerClient: NetworkControllerClient = {
      async switchCaipNetwork(caipChainId) {
        const chainId = caipChainId?.split(':')[1]
        const chainIdNumber = Number(chainId)
        await getState().w3Provider.request({ 
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdNumber }]
         })
      }
    }

    const connectionControllerClient: ConnectionControllerClient = {
      async connectWalletConnect(onUri) {
        const connector = getState().wallets.find(c => c.id === WALLET_CONNECT_ID)
        if (!connector) {
          throw new Error('connectionControllerClient:getWalletConnectUri - connector is undefined')
        }

        console.log("triggered")
        function handleUri(event: any){
          onUri(event.detail.uri)
          window.removeEventListener('walletconnect#uri', handleUri)
        }
        window.addEventListener('walletconnect#uri', handleUri)

        await connectW3(connector)
      },

      async connectExternal(id) {
        const connector = getState().wallets.find(c => c.id === id)
        if (!connector) {
          throw new Error('connectionControllerClient:connectExternal - connector is undefined')
        }

        await connectW3(connector)
      },

      async disconnect(){
        disconnectW3()
      }
    }

    super({
      networkControllerClient,
      connectionControllerClient,
      projectId
    })

    this.syncConnectors()
    subscribe(({ wallets })=> this.syncConnectors())

    this.syncAccount()
    subscribe(({ address })=> this.syncAccount())

    this.syncNetwork()
    subscribe(({ chainId })=> this.syncNetwork())
  }

  // -- Private -----------------------------------------------------------------
  private async syncAccount() {
    const address = getState().address
    const chainId = getState().chainId
    this.resetAccount()
    if (address && chainId) {
      this.resetWcConnection()
      const caipAddress: CaipAddress = `${NAMESPACE}:${chainId}:${address}`
      this.setIsConnected(Boolean(address))
      this.setCaipAddress(caipAddress)
      await Promise.all([
        this.syncProfile(address),
        this.syncBalance(address, getState().chains.find(c => Number(c.chainId) === chainId) as Chain)
      ])
    }
  }

  private async syncNetwork() {
    const address = getState().address
    const chainId = getState().chainId
    if (chainId) {
      const caipChainId: CaipChainId = `${NAMESPACE}:${chainId}`
      this.setCaipNetwork(caipChainId)
      if (address) {
        const caipAddress: CaipAddress = `${NAMESPACE}:${chainId}:${address}`
        this.setCaipAddress(caipAddress)
        await this.syncBalance(address, getState().chains.find(c => Number(c.chainId) === chainId) as Chain)
      }
    }
  }

  private async syncProfile(address: string) {
    const profileName = undefined //TODO fetch ENSName
    if (profileName) {
      this.setProfileName(profileName)
      const profileImage = undefined //TODO fetch Image
      if (profileImage) {
        this.setProfileImage(profileImage)
      }
    }
  }

  private async syncBalance(address: string, chain: Chain) {
    const balance = undefined //TODO fetch balance
    this.setBalance(balance)
  }

  private syncConnectors() {
    const connectors = getState().wallets?.map(
      connector =>
        ({
          id: connector.id,
          name: connector.id === 'injected' ? 'Browser Wallet' : connector.name as string,
          type: connector.id === WALLET_CONNECT_ID ? 'WALLET_CONNECT' : 'EXTERNAL'
        }) as const
    )
    this.setConnectors(connectors ?? [])
  }
}
