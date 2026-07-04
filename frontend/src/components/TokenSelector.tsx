import { useState, useEffect } from "react";
import { createPublicClient, http } from "viem";
import { opnTestnet } from "./opnConfig";

const factoryAbi = [
  { name: "getAllCurves", type: "function", inputs: [], outputs: [{ type: "address[]" }], stateMutability: "view" },
];
const curveAbi = [
  { name: "tokenName", type: "function", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
  { name: "tokenSymbol", type: "function", inputs: [], outputs: [{ type: "string" }], stateMutability: "view" },
];

const client = createPublicClient({ chain: opnTestnet, transport: http("https://testnet-rpc2.iopn.tech") });

interface TokenOption { address: string; name: string; symbol: string; }

export default function TokenSelector({ factoryAddress, onSelect }: { factoryAddress: string; onSelect: (addr: string) => void }) {
  const [open, setOpen] = useState(false);
  const [tokens, setTokens] = useState<TokenOption[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (async () => {
      try {
        const curves = await client.readContract({ address: factoryAddress as `0x${string}`, abi: factoryAbi, functionName: "getAllCurves" }) as string[];
        const results: TokenOption[] = [];
        for (const addr of curves.slice(0, 100)) {
          try {
            const name = await client.readContract({ address: addr as `0x${string}`, abi: curveAbi, functionName: "tokenName" });
            const symbol = await client.readContract({ address: addr as `0x${string}`, abi: curveAbi, functionName: "tokenSymbol" });
            results.push({ address: addr, name: name as string, symbol: symbol as string });
          } catch {}
        }
        setTokens(results);
      } catch {} finally { setLoading(false); }
    })();
  }, [open, factoryAddress]);

  const filtered = tokens.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.symbol.toLowerCase().includes(search.toLowerCase()) ||
    t.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <button onClick={() => setOpen(true)} className="btn-secondary w-full text-left flex items-center justify-between">
        <span>Select a token to trade</span>
        <span className="text-gray-400 ml-2">{tokens.length} tokens found</span>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setOpen(false)}>
          <div className="bg-dark border border-gray-700 rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-bold">Select Token</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="p-3"><input className="input-field" placeholder="Search by name, symbol or address..." value={search} onChange={e => setSearch(e.target.value)} autoFocus /></div>
            <div className="overflow-y-auto max-h-[60vh]">
              {loading ? <div className="p-8 text-center text-gray-500">Loading...</div> :
              filtered.length === 0 ? <div className="p-8 text-center text-gray-500">No tokens found</div> :
              filtered.map(t => (
                <div key={t.address} className="flex items-center justify-between p-3 hover:bg-gray-800 cursor-pointer border-b border-gray-800"
                  onClick={() => { onSelect(t.address); setOpen(false); }}>
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.symbol} • {t.address.substring(0,10)}...</div>
                  </div>
                  <span className="text-xs text-purple-400">Select</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
