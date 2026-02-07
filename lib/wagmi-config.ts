import { http, createConfig, createStorage } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism, base } from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

// WalletConnect project ID - get from https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '3a8170812b534d0ff9d794f19a901d64'

// Public RPC endpoints
const RPC_URLS = {
  [mainnet.id]: 'https://eth.llamarpc.com',
  [polygon.id]: 'https://polygon.llamarpc.com',
  [arbitrum.id]: 'https://arbitrum.llamarpc.com',
  [optimism.id]: 'https://optimism.llamarpc.com',
  [base.id]: 'https://base.llamarpc.com',
}

export const config = createConfig({
  chains: [mainnet, polygon, arbitrum, optimism, base],
  connectors: [
    injected({
      shimDisconnect: true,
    }),
    walletConnect({
      projectId,
      showQrModal: true,
      metadata: {
        name: 'NEUN',
        description: 'Web3 Jobs Platform',
        url: 'https://neun.wtf',
        icons: ['https://neun.wtf/icon.png'],
      },
    }),
    coinbaseWallet({
      appName: 'NEUN',
      appLogoUrl: 'https://neun.wtf/icon.png',
    }),
  ],
  transports: {
    [mainnet.id]: http(RPC_URLS[mainnet.id]),
    [polygon.id]: http(RPC_URLS[polygon.id]),
    [arbitrum.id]: http(RPC_URLS[arbitrum.id]),
    [optimism.id]: http(RPC_URLS[optimism.id]),
    [base.id]: http(RPC_URLS[base.id]),
  },
  // Persist wallet connection state
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }),
  ssr: true,
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}
