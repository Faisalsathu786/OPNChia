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
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [error, setError] = useState("");

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
        if (!active) return;
        setTokenCount(countNum);

        if (countNum === 0) {
          setTokens([]);
          setTotalRaised("0");
          return;
        }

        const curves = await client.readContract({
          address: factoryAddress as `0x${string}`,
          abi: factoryAbi,
          functionName: "getAllCurves",
        });

        const curveAddrs = curves as string[];
        if (!active) return;

        const cards: TokenCard[] = [];
        let sum = 0n;

        for (const addr of curveAddrs.slice(0, 50)) {
          try {
            const [nameR, symR, supR, raiseR, prcR, thrR] = await Promise.all([
              client.readContract({ address: addr as `0x${string}`, abi: curveAbi, functionName: "tokenName" }),
              client.readContract({ address: addr as `0x${string}`, abi: curveAbi, functionName: "tokenSymbol" }),
              client.readContract({ address: addr as `0x${string}`, abi: curveAbi, functionName: "currentSupply" }),
              client.readContract({ address: addr as `0x${string}`, abi: curveAbi, functionName: "totalRaised" }),
              client.readContract({ address: addr as `0x${string}`, abi: curveAbi, functionName: "getCurrentPrice" }),
              client.readContract({ address: addr as `0x${string}`, abi: curveAbi, functionName: "migrationThreshold" }),
            ]);

            const raisedVal = raiseR as bigint;
            sum += raisedVal;

            cards.push({
              curveAddress: addr,
              tokenName: nameR as string,
              tokenSymbol: symR as string,
              supply: (Number(supR) / 1e18).toFixed(1),
              raised: Number(raisedVal) / 1e18 + "",
              price: (Number(prcR) / 1e18).toExponential(3),
              target: (Number(thrR) / 1e18).toFixed(1),
            });
          } catch (e) {
            // skip individual curve read errors
          }
        }

        if (active) {
          setTokens(cards);
          setTotalRaised((Number(sum) / 1e18).toFixed(4));
        }
      } catch (e: any) {
        if (active) {
          setError(e?.message || "Failed to load tokens. Check RPC connection.");
          setTokenCount(0);
        }
      }
    }

    load();
    const interval = setInterval(load, 20000);
    return () => { active = false; clearInterval(interval); };
  }, [factoryAddress]);

  if (tokenCount === null) {
    return <div className="text-center py-16 text-gray-500"><p>Loading tokens...</p></div>;
  }

  if (error) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Token Explorer</h2>
        <div className="card text-center py-16 text-yellow-500">
          <p>RPC connection issue</p>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
          <p className="text-xs text-gray-600 mt-4">Your wallet must be connected to OPN chain. Check MetaMask -> Network -> OPN Testnet.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Token Explorer</h2>
        <span className="text-sm text-gray-500">{tokenCount} created</span>
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
          <div className="text-sm text-gray-400">IOPN Raised</div>
        </div>
      </div>

      {tokens.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <p>No tokens created yet.</p>
          <p className="text-sm mt-2">Use Create tab to launch a token.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tokens.map((t) => {
            const pct = Math.min(100, (parseFloat(t.raised || "0") / parseFloat(t.target || "1")) * 100);
            return (
              <div key={t.curveAddress} className="card cursor-pointer hover:border-purple-500/50 transition-all"
                onClick={() => onSelectToken(t.curveAddress)}>
                <h3 className="font-bold mb-1">{t.tokenName} <span className="text-sm text-gray-400">{t.tokenSymbol}</span></h3>
                <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                  <div><div className="text-gray-500">Price</div><div>{t.price}</div></div>
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
