import { useAccount } from "wagmi";

export default function MyTokens() {
 const { address, isConnected } = useAccount();

 const holdings = [
  { token: "StormChain", symbol: "STORM", balance: "150,000", value: "0.0225", pnl: "+45.2%" },
  { token: "OPN VaultGuard", symbol: "VGD", balance: "500,000", value: "0.0400", pnl: "+28.7%" },
 ];

 const created = [
  { name: "MyTestToken", symbol: "MTT", supply: "10M", status: "Bonding Curve Active" },
 ];

 return (
  <div className="space-y-8">
   <h2 className="text-2xl font-bold">My Tokens</h2>

   {/* Portfolio Summary */}
   <div className="grid grid-cols-3 gap-4">
    <div className="card text-center py-4">
     <div className="text-2xl font-bold text-green-400">0.0625</div>
     <div className="text-sm text-gray-400">Total Value (IOPN)</div>
    </div>
    <div className="card text-center py-4">
     <div className="text-2xl font-bold text-purple-400">2</div>
     <div className="text-sm text-gray-400">Tokens Held</div>
    </div>
    <div className="card text-center py-4">
     <div className="text-2xl font-bold text-blue-400">1</div>
     <div className="text-sm text-gray-400">Tokens Created</div>
    </div>
   </div>

   {/* Holdings */}
   <div>
    <h3 className="text-lg font-bold mb-3">My Holdings</h3>
    {holdings.length === 0 ? (
     <div className="card text-center py-8 text-gray-500">
      No tokens yet. Buy from the Explore tab!
     </div>
    ) : (
     <div className="space-y-3">
      {holdings.map((h, i) => (
       <div key={i} className="card flex items-center justify-between">
        <div>
         <div className="font-bold">{h.token}</div>
         <div className="text-sm text-gray-400">{h.symbol}</div>
        </div>
        <div className="text-right">
         <div className="font-bold">{h.balance} {h.symbol}</div>
         <div className="text-sm text-gray-400">{h.value} IOPN</div>
        </div>
        <div className="text-green-400 font-bold text-sm">{h.pnl}</div>
       </div>
      ))}
     </div>
    )}
   </div>

   {/* Created Tokens */}
   <div>
    <h3 className="text-lg font-bold mb-3">My Created Tokens</h3>
    {created.length === 0 ? (
     <div className="card text-center py-8 text-gray-500">
      No tokens created yet. Create one from the Create tab!
     </div>
    ) : (
     <div className="space-y-3">
      {created.map((c, i) => (
       <div key={i} className="card flex items-center justify-between">
        <div>
         <div className="font-bold">{c.name}</div>
         <div className="text-sm text-gray-400">{c.symbol} · {c.supply} supply</div>
        </div>
        <div>
         <span className="text-xs px-2 py-1 rounded bg-yellow-900 text-yellow-300">
          {c.status}
         </span>
        </div>
       </div>
      ))}
     </div>
    )}
   </div>

   <div className="text-sm text-gray-500 text-center">
    Wallet: {address ? `${address.substring(0, 10)}...${address.substring(address.length - 6)}` : "Not connected"}
   </div>
  </div>
 );
}
