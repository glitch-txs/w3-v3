import { 
  Chain,
  Connector,
  connectW3,
  disconnectW3,
  getW3,
  subW3,
  switchChain
} from 'w3-evm'

import type {
  CaipAddress,
  CaipNetwork,
  CaipNetworkId,
  ConnectionControllerClient,
  LibraryOptions,
  NetworkControllerClient
} from '@web3modal/scaffold'
import { Web3ModalScaffold } from '@web3modal/scaffold'
import {
  ADD_CHAIN_METHOD,
  INJECTED_CONNECTOR_ID,
  NAMESPACE,
  VERSION,
  WALLET_CHOICE_KEY,
  WALLET_CONNECT_CONNECTOR_ID
} from './utils/constants'
import { getCaipDefaultChain } from './utils/helpers'
import {
  ConnectorExplorerIds,
  ConnectorImageIds,
  ConnectorNamesMap,
  ConnectorTypesMap,
  NetworkImageIds
} from './utils/presets'
import EthereumProvider from '@walletconnect/ethereum-provider/dist/types/EthereumProvider'
import { subWC } from 'w3-evm-walletconnect'

// -- Types ---------------------------------------------------------------------
export interface Web3ModalClientOptions extends Omit<LibraryOptions, 'defaultChain'> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any

  chains?: Chain[] | number[]
  defaultChain?: Chain
}

export type Web3ModalOptions = Omit<Web3ModalClientOptions, '_sdkVersion'>

// -- Client --------------------------------------------------------------------
export class Web3Modal extends Web3ModalScaffold {
  public constructor(options: Web3ModalClientOptions) {
    const { chains, defaultChain, _sdkVersion, ...w3mOptions } = options

    if (!w3mOptions.projectId) {
      throw new Error('web3modal:constructor - projectId is undefined')
    }

    if (!getW3.connectors().find(c => c.id === WALLET_CONNECT_CONNECTOR_ID)) {
      throw new Error('web3modal:constructor - WalletConnectConnector is required')
    }

    const networkControllerClient: NetworkControllerClient = {
      switchCaipNetwork: async caipNetwork => {
        const chain = this.caipNetworkIdToNumber(caipNetwork?.id)
        if (chain) {
          await switchChain({ chain })
        }
      },

      async getApprovedCaipNetworksData(): Promise<any> {
        const walletChoice = localStorage.getItem(WALLET_CHOICE_KEY)
        if (walletChoice?.includes(WALLET_CONNECT_CONNECTOR_ID)) {
          const connector = getW3.connectors().find(c => c.id === WALLET_CONNECT_CONNECTOR_ID)
          if (!connector) {
            throw new Error(
              'networkControllerClient:getApprovedCaipNetworks - connector is undefined'
            )
          }
          const provider = await connector.getProvider()
          const ns = (provider as EthereumProvider).signer?.session?.namespaces
          const nsMethods = ns?.[NAMESPACE]?.methods
          const nsChains = ns?.[NAMESPACE]?.chains

          return {
            supportsAllNetworks: nsMethods?.includes(ADD_CHAIN_METHOD),
            approvedCaipNetworkIds: nsChains as CaipNetworkId[]
          }
        }

        return { approvedCaipNetworkIds: undefined, supportsAllNetworks: true }
      }
    }

    const connectionControllerClient: ConnectionControllerClient = {
      connectWalletConnect: async onUri => {
        const connector = getW3.connectors().find(c => c.id === WALLET_CONNECT_CONNECTOR_ID)
        if (!connector) {
          throw new Error('connectionControllerClient:getWalletConnectUri - connector is undefined')
        }

        subWC.uri(onUri)
        const chain = this.caipNetworkIdToNumber(this.getCaipNetwork()?.id)

        await connectW3({ connector, chain })
      },

      connectExternal: async id => {
        const connector = getW3.connectors().find(c => c.id === id)
        if (!connector) {
          throw new Error('connectionControllerClient:connectExternal - connector is undefined')
        }

        const chain = this.caipNetworkIdToNumber(this.getCaipNetwork()?.id)

        await connectW3({ connector, chain })
      },

      connectInjected: async () => {
        const connector = getW3.connectors().find(c => c.id === INJECTED_CONNECTOR_ID)
        if (!connector) {
          throw new Error('connectionControllerClient:connectInjected - connector is undefined')
        }

        const chain = this.caipNetworkIdToNumber(this.getCaipNetwork()?.id)

        await connectW3({ connector, chain })
      },

      checkInjectedInstalled(ids) {
        if (!window?.ethereum) {
          return false
        }

        if (!ids) {
          return Boolean(window.ethereum)
        }

        //@ts-ignore - override type
        return ids.some(id => Boolean(window.ethereum?.[String(id)]))
      },

      disconnect: disconnectW3
    }

    super({
      networkControllerClient,
      connectionControllerClient,
      defaultChain: getCaipDefaultChain(defaultChain),
      _sdkVersion: _sdkVersion ?? `html-wagmi-${VERSION}`,
      ...w3mOptions
    })

    this.syncRequestedNetworks(chains)

    subW3.address(() => this.syncAccount())
    subW3.chainId(() => this.syncNetwork())

    this.syncConnectors(getW3.connectors())
    subW3.connectors(connectors => this.syncConnectors(connectors)) 
  }

  // -- Private -----------------------------------------------------------------

  private syncRequestedNetworks(chains?: Chain[] | number[]) {
    // const requestedCaipNetworks = chains?.map(
    //   chain =>
    //     ({
    //       id: `${NAMESPACE}:${chain.id}`,
    //       name: chain.name,
    //       imageId: NetworkImageIds[chain.id]
    //     }) as CaipNetwork
    // )
    // this.setRequestedCaipNetworks(requestedCaipNetworks ?? [])
  }

  private async syncAccount() {
    const address = getW3.address()
    const chainId = getW3.chainId()
    this.resetAccount()
    if (address) {
      const caipAddress: CaipAddress = `${NAMESPACE}:${chainId}:${address}`
      this.setIsConnected(Boolean(address))
      this.setCaipAddress(caipAddress)
      await Promise.all([
        this.syncProfile(address),
        this.syncBalance(address, chainId),
        this.getApprovedCaipNetworksData()
      ])
    } else if (!address) {
      this.resetWcConnection()
      this.resetNetwork()
    }
  }

  private async syncNetwork() {
    const address = getW3.address()
    const chainId = getW3.chainId()
    if (chainId) {
      const caipChainId: CaipNetworkId = `${NAMESPACE}:${chainId}`
      this.setCaipNetwork({ id: caipChainId, imageId: NetworkImageIds[chainId] })
      if (address) {
        const caipAddress: CaipAddress = `${NAMESPACE}:${chainId}:${address}`
        this.setCaipAddress(caipAddress)
        await this.syncBalance(address, chainId)
      }
    }
  }

  private async syncProfile(address: string) {
    // try {
    //   const { name, avatar } = await this.fetchIdentity({
    //     caipChainId: `${NAMESPACE}:${mainnet.id}`,
    //     address
    //   })
    //   this.setProfileName(name)
    //   this.setProfileImage(avatar)
    // } catch {
    //   const profileName = await fetchEnsName({ address, chainId: mainnet.id })
    //   if (profileName) {
    //     this.setProfileName(profileName)
    //     const profileImage = await fetchEnsAvatar({ name: profileName, chainId: mainnet.id })
    //     if (profileImage) {
    //       this.setProfileImage(profileImage)
    //     }
    //   }
    // }
  }

  private async syncBalance(address: string, chain?: number) {
    // const balance = await fetchBalance({ address, chainId: chain.id })
    // this.setBalance(balance.formatted, balance.symbol)
  }

  private syncConnectors(connectors: Connector[]) {
    const w3mConnectors = connectors.map(
      ({ id, name }) =>
        ({
          id,
          explorerId: ConnectorExplorerIds[id],
          imageId: ConnectorImageIds[id],
          name: ConnectorNamesMap[id] ?? name,
          type: ConnectorTypesMap[id] ?? 'EXTERNAL'
        }) as const
    )
    this.setConnectors(w3mConnectors ?? [])
  }

  private caipNetworkIdToNumber(caipnetworkId?: CaipNetworkId) {
    return caipnetworkId ? Number(caipnetworkId.split(':')[1]) : undefined
  }
}
