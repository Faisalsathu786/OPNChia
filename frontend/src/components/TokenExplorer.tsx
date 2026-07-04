import { useReadContract } from "wagmi";
import { useState, useEffect } from "react";
import { createPublicClient, http } from "viem";
import { opnTestnet } from "./opnConfig";

const FACTORY_ABI = [
  "function getTokenCount() view returns (uint256)",
  "function getAllTokens() view returns (address[])",
  "function getAllCurves() view returns (address[])",
];

const CURVE_ABI = [
  "function tokenName() view returns (string)",
  "function tokenSymbol() view returns (string)",
  "function currentSupply() view returns (uint256)",
  "function tokensForSale() view returns (uint256)",
  "function totalRaised() view returns (uint256)",
  "function migrationThreshold() view returns (uint256)",
  "function getCurrentPrice() view returns (uint256)",
  "function migrated() view returns (bool)",
  "function creator() view returns (address)",
];

interface Props {
  onSelectToken: (address: string) => void;
  factoryAddress: string;
}

const publicClient = createPublicClient({
  chain: opnTestnet,
  transport: http("https://testnet-rpc2.iopn.tech"),
});

interface TokenCard {
  curveAddress: string;
  tokenName: string;
  tokenSymbol: string;
  supply: string;
  raised: string;
  price: string;
  target: string;
}

export default function TokenExplorer({ onSelectToken, factoryAddress }: Props) {
  const [tokens, setTokens] = useState<TokenCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRaised, setTotalRaised] = useState("0");

  const { data: tokenCount } = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "getTokenCount",
  });

  const { data: allCurves } = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "getAllCurves",
  });

  useEffect(() => {
    async function loadTokens() {
      const curves = allCurves as string[] | undefined;
      if (!curves || curves.length === 0) {
        setLoading(false);
        return;
      }

      const tokenCards: TokenCard[] = [];
      let sum = 0n;

      // Process in batches of 10
      const batchSize = 10;
      for (let i = 0; i < curves.length; i += batchSize) {
        const batch = curves.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(async (addr) => {
            const [name, symbol, supply, raised, price, threshold] = await publicClient.multicall({
              contracts: [
                { address: addr as `0x${string}`, abi: CURVE_ABI, functionName: "tokenName" },
                { address: addr as `0x${string}`, abi: CURVE_ABI, functionName: "tokenSymbol" },
                { address: addr as `0x${string}`, abi: CURVE_ABI, functionName: "currentSupply" },
                { address: addr as `0x${string}`, abi: CURVE_ABI, functionName: "totalRaised" },
                { address: addr as `0x${string}`, abi: CURVE_ABI, functionName: "getCurrentPrice" },
                { address: addr as `0x${string}`, abi: CURVE_ABI, functionName: "migrationThreshold" },
              ],
            });

            const raisedVal = results[3].status === "fulfilled" ? (results[3].value as bigint) : 0n;
            sum += raisedVal;

            return {
              curveAddress: addr,
              tokenName: results[0].status === "fulfilled" ? (results[0].value as string) : "Unknown",
              tokenSymbol: results[1].status === "fulfilled" ? (results[1].value as string) : "???",
              supply: results[2].status === "fulfilled" ? (Number(results[2].value) / 1e18).toFixed(1) : "0",
              raised: Number(raisedVal) / 1e18 + "",
              price: results[4].status === "fulfilled" ? (Number(results[4].value) / 1e18).toExponential(3) : "0",
              target: results[5].status === "fulfilled" ? (Number(results[5].value) / 1e18).toFixed(1) : "0",
            };
          })
        );

        for (const r of results) {
          if (r.status === "fulfilled") tokenCards.push(r.value);
        }
      }

      setTokens(tokenCards);
      setTotalRaised((Number(sum) / 1e18).toFixed(2));
      setLoading(false);
    }

    if (allCurves) loadTokens();
  }, [allCurves]);

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>Loading tokens...</p>
      </div>
    );
  }

  const count = Number(tokenCount || 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Token Explorer</h2>
        <span className="text-sm text-gray-500">{count} tokens created</span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center py-4">
          <div className="text-2xl font-bold text-purple-400">{count}</div>
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
          {tokens.map((token) => {
            const progress = Math.min(100, (parseFloat(token.raised || "0") / parseFloat(token.target || "1")) * 100);
            return (
              <div
                key={token.curveAddress}
                className="card cursor-pointer hover:border-purple-500/50 transition-all"
                onClick={() => onSelectToken(token.curveAddress)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold">{token.tokenName}</h3>
                    <span className="text-sm text-gray-400">{token.tokenSymbol}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                  <div>
                    <div className="text-gray-500">Price</div>
                    <div>{token.price} IOPN</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Supply</div>
                    <div>{token.supply}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Raised</div>
                    <div>{parseFloat(token.raised || "0").toFixed(4)} IOPN</div>
                  </div>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{parseFloat(token.raised || "0").toFixed(4)} of {token.target} IOPN</span>
                  <span>{progress.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
