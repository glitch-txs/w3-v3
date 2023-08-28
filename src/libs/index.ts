'use client'

import { useEffect, useState } from 'react'
import type { Web3ModalOptions } from './client'
import { Web3Modal } from './client'
import { VERSION } from './utils/constants'

// -- Types -------------------------------------------------------------------
export type { Web3ModalOptions } from './client'
type OpenOptions = Parameters<Web3Modal['open']>[0]
type ThemeModeOptions = Parameters<Web3Modal['setThemeMode']>[0]
type ThemeVariablesOptions = Parameters<Web3Modal['setThemeVariables']>[0]

// -- Setup -------------------------------------------------------------------
let modal: Web3Modal | undefined = undefined

// -- Lib ---------------------------------------------------------------------
export function createWeb3Modal(options: Web3ModalOptions) {
  if (!modal) {
    modal = new Web3Modal({ ...options, _sdkVersion: `react-wagmi-${VERSION}` })
  }

  return modal
}

export function useWeb3ModalTheme() {
  if (!modal) {
    throw new Error('Please call "createWeb3Modal" before using "useWeb3ModalTheme" hook')
  }

  function setThemeMode(themeMode: ThemeModeOptions) {
    modal?.setThemeMode(themeMode)
  }

  function setThemeVariables(themeVariables: ThemeVariablesOptions) {
    modal?.setThemeVariables(themeVariables)
  }

  const [themeMode, setInternalThemeMode] = useState(modal.getThemeMode())
  const [themeVariables, setInternalThemeVariables] = useState(modal.getThemeVariables())

  useEffect(() => {
    const unsubscribe = modal?.subscribeTheme(state => {
      setInternalThemeMode(state.themeMode)
      setInternalThemeVariables(state.themeVariables)
    })

    return () => {
      unsubscribe?.()
    }
  }, [])

  return {
    themeMode,
    themeVariables,
    setThemeMode,
    setThemeVariables
  }
}

export function useWeb3Modal() {
  if (!modal) {
    throw new Error('Please call "createWeb3Modal" before using "useWeb3Modal" hook')
  }

  async function open(options?: OpenOptions) {
    await modal?.open(options)
  }

  async function close() {
    await modal?.close()
  }

  return { open, close }
}
