import { createStore } from "vanilla-cafe";

export const { get, set } = createStore({
  open: undefined
})

export const openWeb3Modal = get.open() as any