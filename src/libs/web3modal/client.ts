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
} from './constants.js'
import { connectW3, disconnectW3, getW3, subW3 } from '../w3/index.js'
import { switchNetwork } from './utils/index.js'
import type WalletConnectProvider from '@walletconnect/ethereum-provider'

// -- Types ---------------------------------------------------------------------
export interface Web3ModalOptions {
  projectId: ProjectId
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

    this.syncAccount()
    subW3.address(() => this.syncAccount())

    this.syncNetwork()
    subW3.chainId(() => this.syncNetwork())
  }

  // -- Private -----------------------------------------------------------------
  private syncRequestedNetworks(chains: Web3ModalOptions['chains']) {
    const requestedCaipNetworks = chains?.map(
      chain =>
        ({
          id: `${NAMESPACE}:${chain.id}`,
          name: chain.name
        }) as CaipNetwork
    )
    this.setRequestedCaipNetworks(requestedCaipNetworks ?? [])
  }

  private async syncAccount() {
    const { address, isConnected } = getAccount()
    const { chain } = getNetwork()
    this.resetAccount()
    if (isConnected && address && chain) {
      this.resetWcConnection()
      const caipAddress: CaipAddress = `${NAMESPACE}:${chain.id}:${address}`
      this.setIsConnected(isConnected)
      this.setCaipAddress(caipAddress)
      this.syncNetwork()
      await Promise.all([this.syncProfile(address), this.getApprovedCaipNetworksData()])
    } else if (!isConnected) {
      this.resetNetwork()
    }
  }

  private async syncNetwork() {
    const { address, isConnected } = getAccount()
    const { chain } = getNetwork()
    if (chain) {
      const chainId = String(chain.id)
      const caipChainId: CaipNetworkId = `${NAMESPACE}:${chainId}`
      this.setCaipNetwork({ id: caipChainId, name: chain.name })
      if (isConnected && address) {
        const caipAddress: CaipAddress = `${NAMESPACE}:${chain.id}:${address}`
        this.setCaipAddress(caipAddress)
        await this.syncBalance(address, chain)
      }
    }
  }

  private async syncProfile(address: Address) {
    const profileName = await fetchEnsName({ address, chainId: mainnet.id })
    if (profileName) {
      this.setProfileName(profileName)
      const profileImage = await fetchEnsAvatar({ name: profileName, chainId: mainnet.id })
      if (profileImage) {
        this.setProfileImage(profileImage)
      }
    }
  }

  private async syncBalance(address: Address, chain: Chain) {
    const balance = await fetchBalance({ address, chainId: chain.id })
    this.setBalance(balance.formatted, balance.symbol)
  }

  private syncConnectors(connectors: Web3ModalOptions['wagmiConfig']['connectors']) {
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

  private caipNetworkIdToNumber(caipnetworkId?: CaipNetworkId) {
    return caipnetworkId ? Number(caipnetworkId.split(':')[1]) : undefined
  }
}
