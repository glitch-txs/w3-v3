import { Chain, Connector, initW3, setW3 } from "../w3";
import { Web3Modal } from "./client";
import { Plugin } from "./types";

let modal: Web3Modal;

export const openModal = ()=> modal?.open()

export const openAccount = ()=>modal?.open({view: 'Account'})

export const openNetworks = ()=>modal?.open({view: 'Networks'})

export function initWeb3Modal({ connectors, chains, SSR, projectId, plugin }:
  { connectors: Connector[], chains: Chain[], SSR?: boolean, projectId: string, plugin?: Plugin }){
    
  setW3.projectId(projectId)
  
  const props = initW3({
    connectors,
    chains,
    SSR
  })

  modal = new Web3Modal({ projectId, plugin })

  return props
}