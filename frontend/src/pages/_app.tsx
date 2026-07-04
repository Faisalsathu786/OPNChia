import type { AppProps } from "next/app";
import "@/styles/globals.css";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";

const opnChain = {
  id: 984,
  name: "OPN Testnet",
  nativeCurrency: { name: "IOPN", symbol: "IOPN", decimals: 18 },
  rpcUrls: { default: { http: ["https://testnet-rpc2.iopn.tech"] } },
  blockExplorers: { default: { name: "OPNScan", url: "https://testnet.iopn.tech" } },
} as const;

const config = getDefaultConfig({
  appName: "OPNChia",
  projectId: "e65e0e8ee0b354919610b744401ec152",
  chains: [opnChain as any],
  ssr: true,

});

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
