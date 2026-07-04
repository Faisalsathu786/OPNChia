import { useState, useEffect } from "react";
import { createPublicClient, http } from "viem";
import { opnTestnet } from "./opnConfig";

const factoryAbi = [
  { name: "getTokenCount", type: "function", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { name: "getAllCurves", type: "function", inputs: [], outputs: [{ name: "", type: "address[]" }], stateMutability: "view" },
];

const curveAbi = [
  { name: "tokenName", type: "function", inputs: [], outputs: [{ name: "", type: "string" }], stateMutability: "view" },
  { name: "tokenSymbol", type: "function", inputs: [], outputs: [{ name: "", type: "string" }], stateMutability: "view" },
  { name: "currentSupply", type: "function", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { name: "totalRaised", type: "function", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { name: "getCurrentPrice", type: "function", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { name: "migrationThreshold", type: "function", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
];

interface Props {
  onSelectToken: (address: string) => void;
  factoryAddress: string;
}

interface TokenCard {
  curveAddress: string;
  tokenName: string;
  tokenSymbol: string;
  supply: string;
  raised: string;
  price: string;
  target: string;
}

const client = createPublicClient({
  chain: opnTestnet,
  transport: http("https://testnet-rpc2.iopn.tech"),
});

export default function TokenExplorer({ onSelectToken, factoryAddress }: Props) {
  const [tokens, setTokens] = useState<TokenCard[]>([]);
  const [totalRaised, setTotalRaised] = useState("0");
  const [tokenCount, setTokenCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const count = await client.readContract({
          address: factoryAddress as `0x${string}`,
          abi: factoryAbi,
          functionName: "getTokenCount",
        });
        const countNum = Number(count);
        setTokenCount(countNum);

        if (countNum === 0) {
          if (active) setLoading(false);
          return;
        }

        const curves = await client.readContract({
          address: factoryAddress as `0x${string}`,
          abi: factoryAbi,
          functionName: "getAllCurves",
        });

        const curveAddrs = curves as string[];
        const cards: TokenCard[] = [];
        let sum = 0n;

        for (const addr of curveAddrs) {
          try {
            const results = await client.multicall({
              contracts: [
                { address: addr as `0x${string}`, abi: curveAbi, functionName: "tokenName" },
                { address: addr as `0x${string}`, abi: curveAbi, functionName: "tokenSymbol" },
                { address: addr as `0x${string}`, abi: curveAbi, functionName: "currentSupply" },
                { address: addr as `0x${string}`, abi: curveAbi, functionName: "totalRaised" },
                { address: addr as `0x${string}`, abi: curveAbi, functionName: "getCurrentPrice" },
                { address: addr as `0x${string}`, abi: curveAbi, functionName: "migrationThreshold" },
              ],
            });

            const raised = results[3].status === "fulfilled" ? (results[3].value as bigint) : 0n;
            sum += raised;

            cards.push({
              curveAddress: addr,
              tokenName: results[0].status === "fulfilled" ? (results[0].value as string) : "Unknown",
              tokenSymbol: results[1].status === "fulfilled" ? (results[1].value as string) : "???",
              supply: results[2].status === "fulfilled" ? (Number(results[2].value) / 1e18).toFixed(1) : "0",
              raised: Number(raised) / 1e18 + "",
              price: results[4].status === "fulfilled" ? (Number(results[4].value) / 1e18).toExponential(3) : "0",
              target: results[5].status === "fulfilled" ? (Number(results[5].value) / 1e18).toFixed(1) : "0",
            });
          } catch (e) {
            // skip problematic curve
          }
        }

        if (active) {
          setTokens(cards);
          setTotalRaised((Number(sum) / 1e18).toFixed(4));
          setLoading(false);
        }
      } catch (e) {
        if (active) setLoading(false);
      }
    }

    load();
    // Auto-refresh every 15s
    const interval = setInterval(load, 15000);
    return () => { active = false; clearInterval(interval); };
  }, [factoryAddress]);

  if (loading) {
    return <div className="text-center py-16 text-gray-500"><p>Loading tokens...</p></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Token Explorer</h2>
        <span className="text-sm text-gray-500">{tokenCount} token{tokenCount !== 1 ? "s" : ""} created</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center py-4">
          <div className="text-2xl font-bold text-purple-400">{tokenCount}</div>
          <div className="text-sm text-gray-400">Created Tokens</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-2xl font-bold text-purple-400">{tokens.length}</div>
          <div className="text-sm text-gray-400">Active Tokens</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-2xl font-bold text-purple-400">{totalRaised}</div>
          <div className="text-sm text-gray-400">IOPN Total Raised</div>
        </div>
      </div>

      {tokens.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <p>No tokens created yet.</p>
          <p className="text-sm mt-2">Create the first token using the Create tab above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tokens.map((t) => {
            const pct = Math.min(100, (parseFloat(t.raised || "0") / parseFloat(t.target || "1")) * 100);
            return (
              <div key={t.curveAddress} className="card cursor-pointer hover:border-purple-500/50 transition-all"
                onClick={() => onSelectToken(t.curveAddress)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold">{t.tokenName}<span className="text-sm text-gray-400 ml-2">{t.tokenSymbol}</span></h3>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                  <div><div className="text-gray-500">Price</div><div>{t.price} IOPN</div></div>
                  <div><div className="text-gray-500">Supply</div><div>{t.supply}</div></div>
                  <div><div className="text-gray-500">Raised</div><div>{parseFloat(t.raised || "0").toFixed(4)} IOPN</div></div>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{parseFloat(t.raised || "0").toFixed(4)} of {t.target} IOPN</span>
                  <span>{pct.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
