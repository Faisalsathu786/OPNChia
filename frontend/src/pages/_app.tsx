import type { AppProps } from "next/app";
import "@/styles/globals.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";

// OPN Chain config
const opnChain = {
  id: 984,
  name: "OPN Testnet",
  nativeCurrency: { name: "IOPN", symbol: "IOPN", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc2.iopn.tech"] } },
  blockExplorers: { default: { name: "OPNScan", url: "https://testnet.iopn.tech" } },
} as const;

const config = getDefaultConfig({
  appName: "OPNChia",
  projectId: "YOUR_WALLETCONNECT_PROJECT_ID",
  chains: [opnChain as any],
  ssr: true,
});

// NOTE: WalletConnect project ID ke liye:
// 1. Go to cloud.walletconnect.com
// 2. Sign up (free)
// 3. Create project → copy Project ID
// 4. Yahan paste karo (abe "YOUR_WALLETCONNECT_PROJECT_ID" ki jagah)

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <Component {...pageProps} />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
