import type {
  CaipAddress,
  CaipNetwork,
  CaipNetworkId,
  ConnectionControllerClient,
  NetworkControllerClient,
  ProjectId
} from '@web3modal/scaffold'
import { Web3ModalScaffoldHtml } from '@web3modal/scaffold'
import {
  ADD_CHAIN_METHOD,
  INJECTED_ID,
  NAMESPACE,
  NAME_MAP,
  TYPE_MAP,
  WALLET_CHOICE_KEY,
  WALLET_CONNECT_ID
} from './constants'
import { Chain, Connector, connectW3, disconnectW3, getW3, subW3 } from '../w3'
import { switchNetwork } from './utils'
import type WalletConnectProvider from '@walletconnect/ethereum-provider'
import { Plugin } from './types'

// -- Types ---------------------------------------------------------------------
export interface Web3ModalOptions {
  projectId: ProjectId,
  plugin?: Plugin
}

// -- Client --------------------------------------------------------------------
export class Web3Modal extends Web3ModalScaffoldHtml {
  public constructor(options: Web3ModalOptions) {
    const { projectId } = options

    const connectors = getW3.connectors()

    if (!projectId) {
      throw new Error('web3modal:constructor - projectId is undefined')
    }

    if (!connectors.find(c => c.id === WALLET_CONNECT_ID)) {
      throw new Error('web3modal:constructor - WalletConnectConnector is required')
    }

    const networkControllerClient: NetworkControllerClient = {
      switchCaipNetwork: async caipNetwork => {
        const id = this.caipNetworkIdToNumber(caipNetwork?.id)
        const [chain] = getW3.chains().filter(({ chainId })=> Number(chainId) === id )
        if (chain) {
          await switchNetwork(chain)
        }
      },

      async getApprovedCaipNetworksData() {
        const walletChoice = localStorage.getItem(WALLET_CHOICE_KEY)
        if (walletChoice?.includes(WALLET_CONNECT_ID)) {
          const connector = getW3.connectors().find(c => c.id === WALLET_CONNECT_ID)
          if (!connector) {
            throw new Error(
              'networkControllerClient:getApprovedCaipNetworks - connector is undefined'
            )
          }
          const provider = await connector.getProvider()
          const ns = (provider as WalletConnectProvider).signer?.session?.namespaces
          const nsMethods = ns?.[NAMESPACE]?.methods
          const nsChains = ns?.[NAMESPACE]?.chains

          return {
            supportsAllNetworks: Boolean(nsMethods?.includes(ADD_CHAIN_METHOD)),
            approvedCaipNetworkIds: nsChains as CaipNetworkId[]
          }
        }

        return { approvedCaipNetworkIds: undefined, supportsAllNetworks: true }
      }
    }

    const connectionControllerClient: ConnectionControllerClient = {
      connectWalletConnect: async onUri => {
        const connector = getW3.connectors().find(c => c.id === WALLET_CONNECT_ID)
        if (!connector) {
          throw new Error('connectionControllerClient:getWalletConnectUri - connector is undefined')
        }
        //@ts-ignore TODO - Cafe library type issue - I'll solve this later.
        subW3.uri(onUri)

        const chainId = this.caipNetworkIdToNumber(this.getCaipNetwork()?.id)

        /* TODO - Add option to connect to a specific chain */
        await connectW3(connector)
      },

      connectExternal: async id => {
        const connector = getW3.connectors().find(c => c.id === id)
        if (!connector) {
          throw new Error('connectionControllerClient:connectExternal - connector is undefined')
        }

        const chainId = this.caipNetworkIdToNumber(this.getCaipNetwork()?.id)

        /* TODO - Add option to connect to a specific chain */
        await connectW3(connector)
      },

      connectInjected: async () => {
        const connector = getW3.connectors().find(c => c.id === INJECTED_ID)
        if (!connector) {
          throw new Error('connectionControllerClient:connectInjected - connector is undefined')
        }

        const chainId = this.caipNetworkIdToNumber(this.getCaipNetwork()?.id)

        /* TODO - Add option to connect to a specific chain */
        await connectW3(connector)
      },

      checkInjectedInstalled(ids) {
        if (!window?.ethereum) {
          return false
        }

        if (!ids) {
          return Boolean(window.ethereum)
        }

        return ids.some(id => Boolean((window.ethereum as unknown as Record<string, unknown>)?.[String(id)]))
      },

      disconnect: disconnectW3
    }

    super({
      networkControllerClient,
      connectionControllerClient,
      projectId
    })

    this.syncRequestedNetworks(getW3.chains())

    this.syncConnectors(getW3.connectors())
    subW3.connectors((c)=>this.syncConnectors(c as Connector[])) /* EIP-6963 sub */

    this.syncAccount()
    subW3.address(() => this.syncAccount())

    this.syncNetwork()
    subW3.chainId(() => this.syncNetwork())
  }

  // -- Private -----------------------------------------------------------------
  private syncRequestedNetworks(chains: Chain[]) {
    const requestedCaipNetworks = chains?.map(
      chain =>
        ({
          id: `${NAMESPACE}:${Number(chain.chainId)}`,
          name: chain.chainName
        }) as CaipNetwork
    )
    this.setRequestedCaipNetworks(requestedCaipNetworks ?? [])
  }

  private async syncAccount() {
    const address = getW3.address()
    const chainId = getW3.chainId()
    this.resetAccount()
    if (address && chainId) {
      this.resetWcConnection()
      const caipAddress: CaipAddress = `${NAMESPACE}:${chainId}:${address}`
      this.setIsConnected(Boolean(address))
      this.setCaipAddress(caipAddress)
      this.syncNetwork()
      await Promise.all([this.syncProfile(address), this.getApprovedCaipNetworksData()])
    } else if (!address) {
      this.resetNetwork()
    }
  }

  private async syncNetwork() {
    const address = getW3.address()
    const id = getW3.chainId()
    const [chain] = getW3.chains().filter(({chainId})=> Number(chainId) === id)
    if (chain) {
      const caipChainId: CaipNetworkId = `${NAMESPACE}:${id}`
      this.setCaipNetwork({ id: caipChainId, name: chain.chainName })
      if (address) {
        const caipAddress: CaipAddress = `${NAMESPACE}:${id}:${address}`
        this.setCaipAddress(caipAddress)
        await this.syncBalance(address, chain)
      }
    }
  }

  private async syncProfile(address: string) {
    // TODO 
    const profileName = undefined
    if (profileName) {
      this.setProfileName(profileName)
      const profileImage = undefined
      if (profileImage) {
        this.setProfileImage(profileImage)
      }
    }
  }

  private async syncBalance(address: string, chain: Chain) {
    // TODO 
    const balance = undefined
    this.setBalance(balance, balance)
  }

  private syncConnectors(connectors: Connector[]) {
    const w3mConnectors = connectors.map(
      connector =>
        ({
          id: connector.id,
          name: NAME_MAP[connector.id] ?? connector.name,
          type: TYPE_MAP[connector.id] ?? 'EXTERNAL'
        }) as const
    )
    this.setConnectors(w3mConnectors ?? [])
  }

  private caipNetworkIdToNumber(caipNetworkId?: CaipNetworkId) {
    return caipNetworkId ? Number(caipNetworkId.split(':')[1]) : undefined
  }
}
