import { useState, useEffect } from "react";
import { useReadContract, useWriteContract } from "wagmi";

const CURVE_ABI = [
 "function getCurrentPrice() view returns (uint256)",
 "function getCurrentPriceInTokens(uint256 iopnAmount) view returns (uint256)",
 "function buyTokens() payable",
 "function sellTokens(uint256 tokenAmount)",
 "function token() view returns (address)",
 "function tokenName() view returns (string)",
 "function tokenSymbol() view returns (string)",
 "function currentSupply() view returns (uint256)",
 "function tokensForSale() view returns (uint256)",
 "function totalRaised() view returns (uint256)",
 "function migrationThreshold() view returns (uint256)",
 "function migrated() view returns (bool)",
];

interface Props {
 selectedToken: string | null;
 onSelectToken: (addr: string | null) => void;
}

export default function TradePanel({ selectedToken, onSelectToken }: Props) {
 const [buyAmount, setBuyAmount] = useState("10");
 const [sellAmount, setSellAmount] = useState("1000");
 const [action, setAction] = useState<"buy" | "sell">("buy");
 const [loading, setLoading] = useState(false);
 const [txHash, setTxHash] = useState<string | null>(null);

 // Use the selected token address
 const curveAddress = selectedToken;

 const { data: currentPrice } = useReadContract({
  address: curveAddress as `0x${string}`,
  abi: CURVE_ABI,
  functionName: "getCurrentPrice",
 });

 const { data: tokenName } = useReadContract({
  address: curveAddress as `0x${string}`,
  abi: CURVE_ABI,
  functionName: "tokenName",
 });

 const { data: tokenSymbol } = useReadContract({
  address: curveAddress as `0x${string}`,
  abi: CURVE_ABI,
  functionName: "tokenSymbol",
 });

 const { data: currentSupply } = useReadContract({
  address: curveAddress as `0x${string}`,
  abi: CURVE_ABI,
  functionName: "currentSupply",
 });

 const { data: totalRaised } = useReadContract({
  address: curveAddress as `0x${string}`,
  abi: CURVE_ABI,
  functionName: "totalRaised",
 });

 const { data: migrated } = useReadContract({
  address: curveAddress as `0x${string}`,
  abi: CURVE_ABI,
  functionName: "migrated",
 });

 const { writeContract } = useWriteContract();

 if (!curveAddress) {
   return (
     <div className="card text-center py-16 text-gray-500">
       <p>Select a token from Explorer to trade.</p>
     </div>
   );
 }

 const handleBuy = async () => {
  if (!buyAmount) return;
  setLoading(true);
  setTxHash(null);
  try {
   const result = await writeContract({
    address: curveAddress as `0x${string}`,
    abi: CURVE_ABI,
    functionName: "buyTokens",
    value: BigInt(Math.floor(parseFloat(buyAmount) * 1e18)),
   });
   // @ts-ignore
   setTxHash(result?.hash || result);
  } catch (err: any) {
   alert("Error: " + (err?.shortMessage || err?.message));
  } finally {
   setLoading(false);
  }
 };

 const handleSell = async () => {
  if (!sellAmount) return;
  setLoading(true);
  setTxHash(null);
  try {
   const result = await writeContract({
    address: curveAddress as `0x${string}`,
    abi: CURVE_ABI,
    functionName: "sellTokens",
    args: [BigInt(sellAmount) * BigInt(10**18)],
   });
   // @ts-ignore
   setTxHash(result?.hash || result);
  } catch (err: any) {
   alert("Error: " + (err?.shortMessage || err?.message));
  } finally {
   setLoading(false);
  }
 };

 const name = (tokenName as string) || "Token";
 const symbol = (tokenSymbol as string) || "TKN";
 const price = currentPrice ? (Number(currentPrice) / 1e18).toFixed(10) : "—";
 const supply = currentSupply ? (Number(currentSupply) / 1e18).toLocaleString() : "—";
 const raised = totalRaised ? (Number(totalRaised) / 1e18).toFixed(2) : "0";
 const target = "10";
 const progress = totalRaised ? Math.min(100, (Number(totalRaised) / 1e18 / 10) * 100) : 0;

 // Simulated bonding curve chart data
 const chartData = Array.from({ length: 100 }, (_, i) => {
  const supplyAt = i * (Number(currentSupply || 0) / 1e18 / 100);
  const p = 0.00000001 + supplyAt * 0.00000000001;
  return { buy: i, price: p };
 });

 return (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
   {/* Left — Chart + Info */}
   <div className="lg:col-span-2 space-y-6">
    <div className="card">
     <div className="flex items-center justify-between mb-4">
      <div>
       <h2 className="text-xl font-bold">{name} ({symbol})</h2>
       <span className={`text-xs px-2 py-1 rounded ${migrated ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'}`}>
        {migrated ? 'Migrated to DEX' : 'Bonding Curve Active'}
       </span>
      </div>
      <div className="text-right">
       <div className="text-2xl font-bold text-green-400">{price}</div>
       <div className="text-sm text-gray-400">IOPN per token</div>
      </div>
     </div>

     {/* Progress bar */}
     <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
       <span className="text-gray-400">{raised} IOPN raised</span>
       <span className="text-gray-400">{target} IOPN target</span>
      </div>
      <div className="progress-bar">
       <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
     </div>

     {/* Stats */}
     <div className="grid grid-cols-3 gap-4 text-sm">
      <div>
       <div className="text-gray-400">Current Supply</div>
       <div className="font-bold">{supply} {symbol}</div>
      </div>
      <div>
       <div className="text-gray-400">Market Cap</div>
       <div className="font-bold">
        {(Number(price) * Number(supply)).toFixed(2)} IOPN
       </div>
      </div>
      <div>
       <div className="text-gray-400">Supply Remaining</div>
       <div className="font-bold">
        {currentSupply ? (50000000 - Number(currentSupply)).toLocaleString() : "—"}
       </div>
      </div>
     </div>
    </div>

    {/* Bonding Curve Chart */}
    <div className="card">
     <h3 className="font-bold mb-3"> Bonding Curve</h3>
     <div className="h-64 bg-gray-900 rounded-lg p-4">
      <div className="flex items-end h-full gap-[2px]">
       {chartData.map((d, i) => (
        <div
         key={i}
         className="flex-1 bg-purple-500 hover:bg-purple-400 transition-all"
         style={{
          height: `${Math.min(100, (d.price / 0.000001) * 100)}%`,
          opacity: 0.3 + (i / chartData.length) * 0.7,
         }}
         title={`Buy #${d.buy}: ${d.price.toFixed(10)} IOPN`}
        />
       ))}
      </div>
     </div>
     <div className="flex justify-between text-xs text-gray-500 mt-1">
      <span>First buyer (cheapest)</span>
      <span>Last buyer (most expensive)</span>
     </div>
    </div>

    {/* TX Hash */}
    {txHash && (
     <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 text-sm text-green-300">
      Transaction sent!
      <a href={`https://testnet.iopn.tech/tx/${txHash}`} target="_blank" className="underline ml-2">
       View on Explorer →
      </a>
     </div>
    )}
   </div>

   {/* Right — Buy/Sell Panel */}
   <div className="space-y-4">
    {/* Toggle Buy/Sell */}
    <div className="flex bg-gray-900 rounded-lg p-1">
     <button
      className={`flex-1 py-2 rounded-md text-center font-medium transition ${action === 'buy' ? 'bg-green-600 text-white' : 'text-gray-400'}`}
      onClick={() => setAction("buy")}
     >
      Buy
     </button>
     <button
      className={`flex-1 py-2 rounded-md text-center font-medium transition ${action === 'sell' ? 'bg-red-600 text-white' : 'text-gray-400'}`}
      onClick={() => setAction("sell")}
     >
      Sell
     </button>
    </div>

    <div className="card space-y-4">
     {action === "buy" ? (
      <>
       <h3 className="font-bold">Buy {symbol}</h3>
       <div>
        <label className="text-sm text-gray-400">Amount (IOPN)</label>
        <input
         className="input-field mt-1"
         type="number"
         value={buyAmount}
         onChange={e => setBuyAmount(e.target.value)}
        />
       </div>
       {currentPrice && (
        <div className="text-sm text-gray-400">
         ≈ {buyAmount && Number(buyAmount) > 0
          ? (Number(buyAmount) * 1e18 / (currentPrice > BigInt(0) ? Number(currentPrice) : 1)).toLocaleString()
          : "0"} {symbol}
        </div>
       )}
       <button className="btn-primary w-full" onClick={handleBuy} disabled={loading}>
        {loading ? " Buying..." : `Buy Buy ${symbol}`}
       </button>
      </>
     ) : (
      <>
       <h3 className="font-bold">Sell {symbol}</h3>
       <div>
        <label className="text-sm text-gray-400">Token Amount</label>
        <input
         className="input-field mt-1"
         type="number"
         value={sellAmount}
         onChange={e => setSellAmount(e.target.value)}
        />
       </div>
       {currentPrice && (
        <div className="text-sm text-gray-400">
         ≈ {sellAmount && Number(sellAmount) > 0
          ? (Number(sellAmount) * Number(price)).toFixed(6)
          : "0"} IOPN
        </div>
       )}
       <button className="btn-primary w-full !bg-red-600 hover:!bg-red-700" onClick={handleSell} disabled={loading}>
        {loading ? " Selling..." : ` Sell ${symbol}`}
       </button>
      </>
     )}

     {/* Price impact */}
     {currentPrice && (
      <div className="text-xs text-gray-500 border-t border-gray-700 pt-3 mt-3">
       <div className="flex justify-between"><span>Current Price</span><span>{price} IOPN</span></div>
       <div className="flex justify-between"><span>Supply</span><span>{supply} {symbol}</span></div>
       <div className="flex justify-between"><span>Raised</span><span>{raised} / {target} IOPN</span></div>
      </div>
     )}
    </div>

 );
}
