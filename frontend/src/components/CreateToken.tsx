import { useState } from "react";
import { useWriteContract } from "wagmi";

// Minimal ABI for factory createToken
const FACTORY_ABI = [
 "function createToken(string name, string symbol, uint256 totalSupply, uint256 tokensForSale, uint256 basePrice, uint256 curveCoefficient, uint256 migrationThreshold, uint8 decimals) payable",
];

interface Props {
 factoryAddress: string;
}

export default function CreateToken({ factoryAddress }: Props) {
 const [name, setName] = useState("");
 const [symbol, setSymbol] = useState("");
 const [totalSupply, setTotalSupply] = useState("100000000");
 const [tokensForSale, setTokensForSale] = useState("50000000");
 const [basePrice, setBasePrice] = useState("0.00000001");
 const [curveSlope, setCurveSlope] = useState("0.00000000001");
 const [migrationThreshold, setMigrationThreshold] = useState("10");
 const [creationFee, setCreationFee] = useState("0.01");
 const [loading, setLoading] = useState(false);
 const [txHash, setTxHash] = useState<string | null>(null);

 const { writeContract } = useWriteContract();

 const handleCreate = async () => {
  if (!name || !symbol) return;
  setLoading(true);
  setTxHash(null);

  try {
   const result = await writeContract({
    address: factoryAddress as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "createToken",
    args: [
     name,
     symbol,
     BigInt(totalSupply) * BigInt(10**18),
     BigInt(tokensForSale) * BigInt(10**18),
     BigInt(Math.floor(parseFloat(basePrice) * 1e18)),
     BigInt(Math.floor(parseFloat(curveSlope) * 1e18)),
     BigInt(migrationThreshold) * BigInt(10**18),
     18,
    ],
    value: BigInt(Math.floor(parseFloat(creationFee) * 1e18)),
   });
   // @ts-ignore
   setTxHash(result?.hash || result);
  } catch (err: any) {
   alert("Error: " + (err?.shortMessage || err?.message || "Transaction failed"));
  } finally {
   setLoading(false);
  }
 };

 return (
  <div className="max-w-xl mx-auto">
   <h2 className="text-2xl font-bold mb-2">Create a New Token</h2>
   <p className="text-gray-400 mb-6">One click to launch your token with bonding curve on OPN Chain</p>

   <div className="card space-y-4">
    <div className="grid grid-cols-2 gap-4">
     <div>
      <label className="block text-sm text-gray-400 mb-1">Token Name</label>
      <input className="input-field" placeholder="My Token" value={name} onChange={e => setName(e.target.value)} />
     </div>
     <div>
      <label className="block text-sm text-gray-400 mb-1">Symbol</label>
      <input className="input-field" placeholder="MTK" value={symbol} onChange={e => setSymbol(e.target.value)} />
     </div>
    </div>

    <div>
     <label className="block text-sm text-gray-400 mb-1">Total Supply</label>
     <input className="input-field" type="number" value={totalSupply} onChange={e => setTotalSupply(e.target.value)} />
    </div>

    <div>
     <label className="block text-sm text-gray-400 mb-1">Tokens for Sale</label>
     <input className="input-field" type="number" value={tokensForSale} onChange={e => setTokensForSale(e.target.value)} />
    </div>

    <div className="grid grid-cols-2 gap-4">
     <div>
      <label className="block text-sm text-gray-400 mb-1">Starting Price (IOPN)</label>
      <input className="input-field" type="number" step="any" value={basePrice} onChange={e => setBasePrice(e.target.value)} />
     </div>
     <div>
      <label className="block text-sm text-gray-400 mb-1">Curve Slope</label>
      <input className="input-field" type="number" step="any" value={curveSlope} onChange={e => setCurveSlope(e.target.value)} />
     </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
     <div>
      <label className="block text-sm text-gray-400 mb-1">Migration Threshold (IOPN)</label>
      <input className="input-field" type="number" value={migrationThreshold} onChange={e => setMigrationThreshold(e.target.value)} />
     </div>
     <div>
      <label className="block text-sm text-gray-400 mb-1">Creation Fee (IOPN)</label>
      <input className="input-field" value={creationFee} disabled />
     </div>
    </div>

    {/* Curve Preview */}
    <div className="bg-gray-900 rounded-lg p-4 text-sm">
     <p className="text-gray-400 mb-1">Bonding Curve Preview (first 5 buys with 1 IOPN each)</p>
     {[1, 2, 3, 4, 5].map((n) => {
      const supply = BigInt(n) * BigInt(10**18);
      const price = BigInt(Math.floor(parseFloat(basePrice) * 1e18)) + (supply * BigInt(Math.floor(parseFloat(curveSlope) * 1e18))) / BigInt(10**18);
      const tokensPerIopn = BigInt(10**18) * BigInt(10**18) / (price > BigInt(0) ? price : BigInt(1));
      return (
       <div key={n} className="flex justify-between text-gray-500">
        <span>Buy #{n}</span>
        <span>Price: {(Number(price) / 1e18).toFixed(10)} IOPN</span>
        <span>≈ {(Number(tokensPerIopn) / 1e18).toLocaleString()} tokens/IOPN</span>
       </div>
      );
     })}
    </div>

    <button
     className="btn-primary w-full"
     onClick={handleCreate}
     disabled={loading || !name || !symbol}
    >
     {loading ? "Creating..." : "Create Token"}
    </button>

    {txHash && (
     <div className="text-green-400 text-sm mt-2">
      Token created! TX: {txHash.substring(0, 20)}...
     </div>
    )}
   </div>
  </div>
 );
}
