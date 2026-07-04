import { useAccount } from "wagmi";
import { useState, useEffect } from "react";
import { createPublicClient, http } from "viem";
import { opnTestnet } from "./opnConfig";

interface Props {
  factoryAddress: string;
}

const factoryAbi = [
  { name: "getAllCurves", type: "function", inputs: [], outputs: [{ name: "", type: "address[]" }], stateMutability: "view" },
];

const curveAbi = [
  { name: "tokenName", type: "function", inputs: [], outputs: [{ name: "", type: "string" }], stateMutability: "view" },
  { name: "tokenSymbol", type: "function", inputs: [], outputs: [{ name: "", type: "string" }], stateMutability: "view" },
];

const client = createPublicClient({
  chain: opnTestnet,
  transport: http("https://testnet-rpc2.iopn.tech"),
});

export default function MyTokens({ factoryAddress }: Props) {
  const { address, isConnected } = useAccount();
  const [holdings, setHoldings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address || !factoryAddress) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const curves = await client.readContract({
          address: factoryAddress as `0x${string}`,
          abi: factoryAbi,
          functionName: "getAllCurves",
        }) as string[];

        // Read token name/symbol for each curve
        const items = [];
        for (const addr of curves.slice(0, 50)) {
          try {
            const name = await client.readContract({ address: addr as `0x${string}`, abi: curveAbi, functionName: "tokenName" }).catch(() => "");
            const symbol = await client.readContract({ address: addr as `0x${string}`, abi: curveAbi, functionName: "tokenSymbol" }).catch(() => "");
            items.push({ address: addr, name, symbol });
          } catch(e) {}
        }
        setHoldings(items);
      } catch(e) {}
      setLoading(false);
    }

    load();
  }, [address, factoryAddress]);

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">My Tokens</h2>

      <div className="card text-center py-4">
        <div className="text-lg text-gray-400">{isConnected ? address?.substring(0, 10) + "..." + address?.substring(address.length - 6) : "Not connected"}</div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-3">Token Holdings</h3>
        {!isConnected ? (
          <div className="card text-center py-8 text-gray-500">
            Connect your wallet to see your tokens.
          </div>
        ) : loading ? (
          <div className="card text-center py-8 text-gray-500">
            Loading...
          </div>
        ) : holdings.length === 0 ? (
          <div className="card text-center py-8 text-gray-500">
            No tokens created on this chain yet.
          </div>
        ) : (
          <div className="space-y-3">
            {holdings.map((h, i) => (
              <div key={i} className="card flex items-center justify-between">
                <div>
                  <div className="font-bold">{h.name || "Unknown"}</div>
                  <div className="text-sm text-gray-400">{h.symbol || "---"}</div>
                </div>
                <div className="text-xs text-gray-500">
                  <a href={`https://testnet.iopn.tech/address/${h.address}`} target="_blank" className="underline">
                    Explorer
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
