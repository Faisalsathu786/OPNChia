import { defineChain } from "viem";

export const opnTestnet = defineChain({
  id: 984,
  name: "OPN Testnet",
  nativeCurrency: { name: "IOPN", symbol: "IOPN", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet-rpc2.iopn.tech"] },
    public: { http: ["https://testnet-rpc2.iopn.tech"] },
  },
  blockExplorers: {
    default: { name: "OPNScan", url: "https://testnet.iopn.tech" },
  },
  testnet: true,
});
