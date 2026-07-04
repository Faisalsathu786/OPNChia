import { useState } from "react";
import { useReadContract, useWriteContract } from "wagmi";

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

export default function TradePanel({ selectedToken }: { selectedToken: string | null }) {
 const [buyAmount, setBuyAmount] = useState("1");
 const [sellAmount, setSellAmount] = useState("");
 const [action, setAction] = useState<"buy" | "sell">("buy");
 const [loading, setLoading] = useState(false);
 const [txHash, setTxHash] = useState<string | null>(null);

 const curveAddress = selectedToken as `0x${string}` | undefined;

 const { data: currentPrice } = useReadContract({ address: curveAddress, abi: CURVE_ABI, functionName: "getCurrentPrice", query: { enabled: !!curveAddress } });
 const { data: tokenName } = useReadContract({ address: curveAddress, abi: CURVE_ABI, functionName: "tokenName", query: { enabled: !!curveAddress } });
 const { data: tokenSymbol } = useReadContract({ address: curveAddress, abi: CURVE_ABI, functionName: "tokenSymbol", query: { enabled: !!curveAddress } });
 const { data: currentSupply } = useReadContract({ address: curveAddress, abi: CURVE_ABI, functionName: "currentSupply", query: { enabled: !!curveAddress } });
 const { data: totalRaised } = useReadContract({ address: curveAddress, abi: CURVE_ABI, functionName: "totalRaised", query: { enabled: !!curveAddress } });
 const { data: migrated } = useReadContract({ address: curveAddress, abi: CURVE_ABI, functionName: "migrated", query: { enabled: !!curveAddress } });
 const { data: tokensForSale } = useReadContract({ address: curveAddress, abi: CURVE_ABI, functionName: "tokensForSale", query: { enabled: !!curveAddress } });

 const { writeContract } = useWriteContract();

 if (!selectedToken) {
  return <div className="card text-center py-16 text-gray-500"><p>Select a token from the Explorer to start trading.</p></div>;
 }

 const name = (tokenName as string) || "Token";
 const symbol = (tokenSymbol as string) || "TKN";
 const price = currentPrice ? (Number(currentPrice) / 1e18).toFixed(8) : "Loading...";
 const supply = currentSupply ? (Number(currentSupply) / 1e18).toLocaleString() : "0";
 const raised = totalRaised ? (Number(totalRaised) / 1e18).toFixed(4) : "0";
 const total = tokensForSale ? (Number(tokensForSale) / 1e18).toFixed(0) : "—";
 const progress = totalRaised && totalRaised > 0n ? 100 : 0;

 const handleBuy = async () => {
  if (!buyAmount) return;
  setLoading(true); setTxHash(null);
  try {
   writeContract({ address: curveAddress, abi: CURVE_ABI, functionName: "buyTokens", value: BigInt(Math.floor(parseFloat(buyAmount) * 1e18)) });
  } catch (e: any) { alert(e?.message || "Error"); } finally { setLoading(false); }
 };

 const handleSell = async () => {
  if (!sellAmount) return;
  setLoading(true); setTxHash(null);
  try {
   writeContract({ address: curveAddress, abi: CURVE_ABI, functionName: "sellTokens", args: [BigInt(Math.floor(parseFloat(sellAmount) * 1e18))] });
  } catch (e: any) { alert(e?.message || "Error"); } finally { setLoading(false); }
 };

 return (
  <div>
   <div className="card mb-6">
    <div className="flex items-center justify-between">
     <div>
      <h2 className="text-xl font-bold">{name} ({symbol})</h2>
      <span className={`text-xs px-2 py-1 rounded ${migrated ? "bg-green-900 text-green-300" : "bg-yellow-900 text-yellow-300"}`}>
       {migrated ? "Migrated" : "Bonding Curve Active"}
      </span>
     </div>
     <div className="text-right"><div className="text-xl font-bold text-green-400">{price}</div><div className="text-sm text-gray-400">IOPN per token</div></div>
    </div>
   </div>

   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div className="card space-y-4">
     <div className="flex bg-gray-900 rounded-lg p-1">
      <button className={`flex-1 py-2 rounded-md font-medium transition ${action==="buy"?"bg-green-600 text-white":"text-gray-400"}`} onClick={()=>setAction("buy")}>Buy</button>
      <button className={`flex-1 py-2 rounded-md font-medium transition ${action==="sell"?"bg-red-600 text-white":"text-gray-400"}`} onClick={()=>setAction("sell")}>Sell</button>
     </div>
     {action==="buy" ? (
      <>
       <div><label className="text-sm text-gray-400">Amount (IOPN)</label><input className="input-field mt-1" type="number" value={buyAmount} onChange={e=>setBuyAmount(e.target.value)} /></div>
       {currentPrice && <div className="text-sm text-gray-400">{buyAmount ? Math.floor(parseFloat(buyAmount)/(Number(currentPrice)/1e18)) : 0} {symbol}</div>}
       <button className="btn-primary w-full" onClick={handleBuy} disabled={loading}>{loading?"Processing...":"Buy "+symbol}</button>
      </>
     ) : (
      <>
       <div><label className="text-sm text-gray-400">Token Amount</label><input className="input-field mt-1" type="number" value={sellAmount} onChange={e=>setSellAmount(e.target.value)} /></div>
       {currentPrice && <div className="text-sm text-gray-400">{sellAmount ? (parseFloat(sellAmount)*(Number(currentPrice)/1e18)).toFixed(6) : 0} IOPN</div>}
       <button className="btn-primary w-full !bg-red-600 hover:!bg-red-700" onClick={handleSell} disabled={loading}>{loading?"Processing...":"Sell "+symbol}</button>
      </>
     )}
    </div>

    <div className="card space-y-3">
     <h3 className="font-bold">Bonding Curve Stats</h3>
     <div className="space-y-2 text-sm">
      <div className="flex justify-between"><span className="text-gray-400">Price</span><span>{price} IOPN</span></div>
      <div className="flex justify-between"><span className="text-gray-400">Supply</span><span>{supply} {symbol}</span></div>
      <div className="flex justify-between"><span className="text-gray-400">Raised</span><span>{raised} IOPN</span></div>
      <div className="flex justify-between"><span className="text-gray-400">Sale Cap</span><span>{total} {symbol}</span></div>
      <div className="flex justify-between"><span className="text-gray-400">Progress</span><span>{progress}%</span></div>
     </div>
     <div className="progress-bar"><div className="progress-fill" style={{width:`${progress}%`}}/></div>
    </div>
   </div>

   {txHash && <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 mt-4 text-sm text-green-300">Transaction: <a href={`https://testnet.iopn.tech/tx/${txHash}`} target="_blank" className="underline">{txHash.substring(0,20)}...</a></div>}
  </div>

 );
}