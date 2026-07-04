import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { createPublicClient, http } from "viem";
import { opnTestnet } from "./opnConfig";

const factoryAbi = [
  { name: "getTokenCount", type: "function", inputs: [], outputs: [{ name: "", type: "uint256" }], stateMutability: "view" },
  { name: "getAllCurves", type: "function", inputs: [], outputs: [{ name: "", type: "address[]" }], stateMutability: "view" },
];

const curveAbi = [
  { name: "tokenName", type: "function", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { name: "tokenSymbol", type: "function", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { name: "currentSupply", type: "function", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { name: "totalRaised", type: "function", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { name: "getCurrentPrice", type: "function", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { name: "migrationThreshold", type: "function", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
];

interface TokenCard { curveAddress: string; tokenName: string; tokenSymbol: string; supply: string; raised: string; price: string; target: string; }

const client = createPublicClient({ chain: opnTestnet, transport: http("https://testnet-rpc2.iopn.tech") });

export default function TokenExplorer({ onSelectToken, factoryAddress }: { onSelectToken: (addr: string) => void; factoryAddress: string }) {
  const [tokens, setTokens] = useState<TokenCard[]>([]);
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [errMsg, setErrMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const count = await client.readContract({ address: factoryAddress as `0x${string}`, abi: factoryAbi, functionName: "getTokenCount" }) as bigint;
      const n = Number(count);
      setTokenCount(n);
      if (n === 0) { setTokens([]); return; }

      const curves = await client.readContract({ address: factoryAddress as `0x${string}`, abi: factoryAbi, functionName: "getAllCurves" }) as string[];
      const cards: TokenCard[] = [];
      let totalRaised = 0n;

      for (const addr of curves) {
        try {
          const name = await client.readContract({ address: addr as `0x${string}`, abi: curveAbi, functionName: "tokenName" });
          const sym = await client.readContract({ address: addr as `0x${string}`, abi: curveAbi, functionName: "tokenSymbol" });
          cards.push({ curveAddress: addr, tokenName: name as string, tokenSymbol: sym as string, supply: "", raised: "0", price: "", target: "" });
        } catch(e) {}
      }

      // Read detailed data in parallel
      const p = cards.map(async (c) => {
        try {
          const [s, r, pr, t] = await Promise.all([
            client.readContract({ address: c.curveAddress as `0x${string}`, abi: curveAbi, functionName: "currentSupply" }).catch(() => 0n),
            client.readContract({ address: c.curveAddress as `0x${string}`, abi: curveAbi, functionName: "totalRaised" }).catch(() => 0n),
            client.readContract({ address: c.curveAddress as `0x${string}`, abi: curveAbi, functionName: "getCurrentPrice" }).catch(() => 0n),
            client.readContract({ address: c.curveAddress as `0x${string}`, abi: curveAbi, functionName: "migrationThreshold" }).catch(() => 0n),
          ]);
          const raised = r as bigint;
          totalRaised += raised;
          return { ...c, supply: (Number(s) / 1e18).toFixed(1), raised: Number(raised) / 1e18 + "", price: (Number(pr) / 1e18).toExponential(3), target: (Number(t) / 1e18).toFixed(1) };
        } catch { return c; }
      });
      const updated = await Promise.all(p);
      setTokens(updated);
      setErrMsg("");
    } catch (e: any) {
      setErrMsg(e?.message || "Read failed");
    }
  }, [factoryAddress]);

  useEffect(() => {
    load();
    const iv = setInterval(load, 20000);
    return () => clearInterval(iv);
  }, [load]);

  if (tokenCount === null) return <div className="text-center py-16 text-gray-500"><p>Loading tokens...</p></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Token Explorer</h2>
        <span className="text-sm text-gray-500">{tokenCount} created</span>
      </div>

      {errMsg && <div className="card mb-4 py-3 text-yellow-400 text-sm">RPC note: {errMsg}. Wallet connected to OPN Chain?</div>}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center py-4"><div className="text-2xl font-bold text-purple-400">{tokenCount}</div><div className="text-sm text-gray-400">Created Tokens</div></div>
        <div className="card text-center py-4"><div className="text-2xl font-bold text-purple-400">{tokens.length}</div><div className="text-sm text-gray-400">Active Tokens</div></div>
        <div className="card text-center py-4"><div className="text-2xl font-bold text-purple-400">{tokens.reduce((s, t) => s + parseFloat(t.raised || "0"), 0).toFixed(4)}</div><div className="text-sm text-gray-400">IOPN Raised</div></div>
      </div>

      {tokens.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <p>No tokens created yet.</p>
          <p className="text-sm mt-2">Use Create tab to launch a token.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tokens.map((t) => {
            const pct = Math.min(100, (parseFloat(t.raised || "0") / (parseFloat(t.target) || 1)) * 100);
            return (
              <div key={t.curveAddress} className="card cursor-pointer hover:border-purple-500/50 transition-all" onClick={() => onSelectToken(t.curveAddress)}>
                <h3 className="font-bold mb-1">{t.tokenName || "Unnamed"} <span className="text-sm text-gray-400">{t.tokenSymbol || "---"}</span></h3>
                <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                  <div><div className="text-gray-500">Price</div><div>{t.price || "---"}</div></div>
                  <div><div className="text-gray-500">Supply</div><div>{t.supply || "---"}</div></div>
                  <div><div className="text-gray-500">Raised</div><div>{parseFloat(t.raised || "0").toFixed(4)} IOPN</div></div>
                </div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{parseFloat(t.raised || "0").toFixed(4)} of {t.target || "---"} IOPN</span>
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
