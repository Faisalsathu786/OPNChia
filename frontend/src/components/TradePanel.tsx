import { useState } from "react";
import { useReadContract, useWriteContract } from "wagmi";
import TokenSelector from "./TokenSelector";

const CURVE_ABI = [
 "function getCurrentPrice() view returns (uint256)",
 "function buyTokens() payable",
 "function sellTokens(uint256 tokenAmount)",
 "function tokenName() view returns (string)",
 "function tokenSymbol() view returns (string)",
 "function currentSupply() view returns (uint256)",
 "function tokensForSale() view returns (uint256)",
 "function totalRaised() view returns (uint256)",
 "function migrationThreshold() view returns (uint256)",
 "function migrated() view returns (bool)",
];

export default function TradePanel({ selectedToken, factoryAddress, onSelectToken }: { selectedToken: string | null; factoryAddress: string; onSelectToken: (addr: string) => void }) {
 const [buyAmount, setBuyAmount] = useState("1");
 const [sellAmount, setSellAmount] = useState("");
 const [action, setAction] = useState<"buy" | "sell">("buy");

 const addr = selectedToken ? (selectedToken as `0x${string}`) : undefined;

 const { data: price } = useReadContract({ address: addr, abi: CURVE_ABI, functionName: "getCurrentPrice", query: { enabled: !!addr } });
 const { data: tokenName } = useReadContract({ address: addr, abi: CURVE_ABI, functionName: "tokenName", query: { enabled: !!addr } });
 const { data: tokenSymbol } = useReadContract({ address: addr, abi: CURVE_ABI, functionName: "tokenSymbol", query: { enabled: !!addr } });
 const { data: supply } = useReadContract({ address: addr, abi: CURVE_ABI, functionName: "currentSupply", query: { enabled: !!addr } });
 const { data: raised } = useReadContract({ address: addr, abi: CURVE_ABI, functionName: "totalRaised", query: { enabled: !!addr } });
 const { data: migrated } = useReadContract({ address: addr, abi: CURVE_ABI, functionName: "migrated", query: { enabled: !!addr } });
 const { data: saleCap } = useReadContract({ address: addr, abi: CURVE_ABI, functionName: "tokensForSale", query: { enabled: !!addr } });

 const { writeContract, data: hash, isPending } = useWriteContract();

 if (!selectedToken) {
  return (
   <div className="max-w-xl mx-auto space-y-4">
    <TokenSelector factoryAddress={factoryAddress} onSelect={onSelectToken} />
    <div className="card text-center py-16 text-gray-500"><p>Select a token from the list above to start trading.</p></div>
   </div>
  );
 }

 const name = (tokenName as string) || "Loading...";
 const symbol = (tokenSymbol as string) || "...";
 const p = price ? (Number(price) / 1e18).toFixed(8) : "...";
 const s = supply ? (Number(supply) / 1e18).toLocaleString() : "0";
 const r = raised ? (Number(raised) / 1e18).toFixed(4) : "0";
 const cap = saleCap ? (Number(saleCap) / 1e18).toFixed(0) : "...";
 const prog = raised && saleCap ? Math.min(100, Number(raised) * 100 / Number(saleCap)) : 0;

 const handleBuy = () => {
  if (!buyAmount || !addr) return;
  writeContract({ address: addr, abi: CURVE_ABI, functionName: "buyTokens", value: BigInt(Math.floor(parseFloat(buyAmount) * 1e18)) });
 };

 const handleSell = () => {
  if (!sellAmount || !addr) return;
  writeContract({ address: addr, abi: CURVE_ABI, functionName: "sellTokens", args: [BigInt(Math.floor(parseFloat(sellAmount) * 1e18))] });
 };

 return (
  <div>
   <div className="mb-6"><TokenSelector factoryAddress={factoryAddress} onSelect={onSelectToken} /></div>
   <div className="card mb-6">
    <div className="flex items-center justify-between">
     <div>
      <h2 className="text-xl font-bold">{name} ({symbol})</h2>
      <span className={`text-xs px-2 py-1 rounded ${migrated ? "bg-green-900 text-green-300" : "bg-yellow-900 text-yellow-300"}`}>{migrated ? "Migrated" : "Active"}</span>
     </div>
     <div className="text-right"><div className="text-xl font-bold text-green-400">{p}</div><div className="text-sm text-gray-400">IOPN per token</div></div>
    </div>
   </div>

   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="card space-y-4">
     <div className="flex bg-gray-900 rounded-lg p-1">
      <button className={`flex-1 py-2 rounded-md font-medium ${action==="buy"?"bg-green-600 text-white":"text-gray-400"}`} onClick={()=>setAction("buy")}>Buy</button>
      <button className={`flex-1 py-2 rounded-md font-medium ${action==="sell"?"bg-red-600 text-white":"text-gray-400"}`} onClick={()=>setAction("sell")}>Sell</button>
     </div>
     {action==="buy" ? (
      <>
       <div><label className="text-sm text-gray-400">Amount (IOPN)</label><input className="input-field mt-1" type="number" value={buyAmount} onChange={e=>setBuyAmount(e.target.value)} /></div>
       {price && <div className="text-sm text-gray-400">{buyAmount ? Math.floor(parseFloat(buyAmount)/(Number(price) / 1e18)) : 0} {symbol}</div>}
       <button className="btn-primary w-full" onClick={handleBuy} disabled={isPending}>{isPending?"Processing...":"Buy "+symbol}</button>
      </>
     ) : (
      <>
       <div><label className="text-sm text-gray-400">Token Amount</label><input className="input-field mt-1" type="number" value={sellAmount} onChange={e=>setSellAmount(e.target.value)} /></div>
       {price && <div className="text-sm text-gray-400">{sellAmount ? (parseFloat(sellAmount)*(Number(price)/1e18)).toFixed(6) : 0} IOPN</div>}
       <button className="btn-primary w-full !bg-red-600 hover:!bg-red-700" onClick={handleSell} disabled={isPending}>{isPending?"Processing...":"Sell "+symbol}</button>
      </>
     )}
    </div>
    <div className="card space-y-3">
     <h3 className="font-bold">Bonding Curve Stats</h3>
     <div className="space-y-2 text-sm">
      <div className="flex justify-between"><span className="text-gray-400">Price</span><span>{p} IOPN</span></div>
      <div className="flex justify-between"><span className="text-gray-400">Supply</span><span>{s} {symbol}</span></div>
      <div className="flex justify-between"><span className="text-gray-400">Raised</span><span>{r} IOPN</span></div>
      <div className="flex justify-between"><span className="text-gray-400">Sale Cap</span><span>{cap} {symbol}</span></div>
     </div>
     <div className="progress-bar"><div className="progress-fill" style={{width:`${prog}%`}}></div></div>
     <div className="text-xs text-gray-500">Progress: {prog.toFixed(1)}%</div>
    </div>
   </div>
   {hash && <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 mt-4 text-sm text-green-300">Tx: <a href={`https://testnet.iopn.tech/tx/${hash}`} target="_blank" className="underline">{hash.substring(0,20)}...</a></div>}
  </div>
 );
}
