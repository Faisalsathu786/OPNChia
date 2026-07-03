import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useReadContract } from "wagmi";

const FACTORY_ABI = [
  "function getTokenCount() view returns (uint256)",
  "function getAllTokens() view returns (address[])",
  "function getAllCurves() view returns (address[])",
  "function creationFee() view returns (uint256)",
  "function protocolFeeRecipient() view returns (address)",
  "function migrator() view returns (address)",
  "function setCreationFee(uint256 _fee)",
  "function setMigrator(address _migrator)",
  "function withdrawFees()",
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
];

interface Props {
  factoryAddress: string;
  adminAddress?: string;
}

export default function AdminPanel({ factoryAddress, adminAddress }: Props) {
  const { address, isConnected } = useAccount();
  const { writeContract } = useWriteContract();

  const [newFee, setNewFee] = useState("0.01");
  const [newMigrator, setNewMigrator] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [loading, setLoading] = useState("");

  // Read factory data
  const { data: tokenCount } = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "getTokenCount",
  });

  const { data: allTokens } = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "getAllTokens",
  });

  const { data: currentFee } = useReadContract({
    address: factoryAddress as `0x${string}`,
    abi: FACTORY_ABI,
    functionName: "creationFee",
  });

  const isAdmin = isConnected && address?.toLowerCase() === adminAddress?.toLowerCase();

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
        <p className="text-gray-400">Connect with the deployer wallet to access admin panel.</p>
      </div>
    );
  }

  const tokens = (allTokens as string[]) || [];
  const fee = currentFee ? (Number(currentFee) / 1e18).toFixed(4) : "—";

  const handleUpdateFee = async () => {
    setLoading("fee");
    try {
      const result = await writeContract({
        address: factoryAddress as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: "setCreationFee",
        args: [BigInt(Math.floor(parseFloat(newFee) * 1e18))],
      });
      // @ts-ignore
      setTxHash(result?.hash || result);
    } catch (err: any) {
      alert("Error: " + (err?.shortMessage || err?.message));
    } finally {
      setLoading("");
    }
  };

  const handleUpdateMigrator = async () => {
    if (!newMigrator) return;
    setLoading("migrator");
    try {
      const result = await writeContract({
        address: factoryAddress as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: "setMigrator",
        args: [newMigrator as `0x${string}`],
      });
      // @ts-ignore
      setTxHash(result?.hash || result);
    } catch (err: any) {
      alert("Error: " + (err?.shortMessage || err?.message));
    } finally {
      setLoading("");
    }
  };

  const handleWithdraw = async () => {
    setLoading("withdraw");
    try {
      const result = await writeContract({
        address: factoryAddress as `0x${string}`,
        abi: FACTORY_ABI,
        functionName: "withdrawFees",
      });
      // @ts-ignore
      setTxHash(result?.hash || result);
    } catch (err: any) {
      alert("Error: " + (err?.shortMessage || err?.message));
    } finally {
      setLoading("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">⚙️ Admin Panel</h2>
        <span className="text-xs text-gray-500">Factory: {factoryAddress.substring(0, 14)}...</span>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card text-center py-4">
          <div className="text-2xl font-bold text-purple-400">{Number(tokenCount || 0)}</div>
          <div className="text-sm text-gray-400">Total Tokens</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-2xl font-bold text-green-400">{fee} IOPN</div>
          <div className="text-sm text-gray-400">Creation Fee</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-2xl font-bold text-blue-400">{tokens.length}</div>
          <div className="text-sm text-gray-400">Active Curves</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-2xl font-bold text-yellow-400">4.6K+</div>
          <div className="text-sm text-gray-400">Builders</div>
        </div>
      </div>

      {/* Admin Controls */}
      <div className="grid grid-cols-2 gap-6">
        {/* Update Fee */}
        <div className="card space-y-3">
          <h3 className="font-bold">💰 Update Creation Fee</h3>
          <div>
            <label className="text-sm text-gray-400">New Fee (IOPN)</label>
            <input className="input-field mt-1" type="number" value={newFee} onChange={e => setNewFee(e.target.value)} />
          </div>
          <button className="btn-primary w-full text-sm" onClick={handleUpdateFee} disabled={loading === "fee"}>
            {loading === "fee" ? "⏳ Updating..." : "Update Fee"}
          </button>
        </div>

        {/* Update Migrator */}
        <div className="card space-y-3">
          <h3 className="font-bold">🔗 Update Migrator Address</h3>
          <div>
            <label className="text-sm text-gray-400">New Migrator Address</label>
            <input className="input-field mt-1" placeholder="0x..." value={newMigrator} onChange={e => setNewMigrator(e.target.value)} />
          </div>
          <button className="btn-primary w-full text-sm" onClick={handleUpdateMigrator} disabled={loading === "migrator"}>
            {loading === "migrator" ? "⏳ Updating..." : "Update Migrator"}
          </button>
        </div>
      </div>

      {/* Withdraw Fees */}
      <div className="card flex items-center justify-between">
        <div>
          <h3 className="font-bold">🏦 Withdraw Platform Fees</h3>
          <p className="text-sm text-gray-400">Withdraw collected creation fees to admin wallet</p>
        </div>
        <button className="btn-primary" onClick={handleWithdraw} disabled={loading === "withdraw"}>
          {loading === "withdraw" ? "⏳ Processing..." : "Withdraw All"}
        </button>
      </div>

      {/* All Created Tokens */}
      <div className="card">
        <h3 className="font-bold mb-4">📋 All Created Tokens ({tokens.length})</h3>
        {tokens.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No tokens created yet</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tokens.map((token: string, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg text-sm">
                <span className="text-gray-400">#{i + 1}</span>
                <span className="font-mono text-xs">{token.substring(0, 10)}...{token.substring(token.length - 6)}</span>
                <a href={`https://testnet.iopn.tech/address/${token}`} target="_blank" className="text-purple-400 hover:underline text-xs">
                  Explorer →
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {txHash && (
        <div className="bg-green-900/30 border border-green-700 rounded-lg p-3 text-sm text-green-300 text-center">
          ✅ Transaction: {txHash.substring(0, 30)}...
          <a href={`https://testnet.iopn.tech/tx/${txHash}`} target="_blank" className="underline ml-2">
            View on Explorer →
          </a>
        </div>
      )}
    </div>
  );
}
