import { useState } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

const FACTORY_ABI = [
  {
    inputs: [
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
      { name: "totalSupply", type: "uint256" },
      { name: "tokensForSale", type: "uint256" },
      { name: "basePrice", type: "uint256" },
      { name: "curveCoefficient", type: "uint256" },
      { name: "migrationThreshold", type: "uint256" },
      { name: "decimals", type: "uint8" },
    ],
    name: "createToken",
    outputs: [{ name: "tokenAddress", type: "address" }, { name: "curveAddress", type: "address" }],
    stateMutability: "payable",
    type: "function",
  },
] as const;

interface Props {
  factoryAddress: `0x${string}`;
}

export default function CreateToken({ factoryAddress }: Props) {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [totalSupply, setTotalSupply] = useState("10000000");
  const [tokensForSale, setTokensForSale] = useState("5000000");
  const [basePrice, setBasePrice] = useState("0.0001");
  const [curveCoefficient, setCurveCoefficient] = useState("0.00000001");
  const [migrationThreshold, setMigrationThreshold] = useState("500");

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const creationFee = "0.01";

  const handleCreate = async () => {
    if (!name || !symbol) {
      alert("Name and symbol are required");
      return;
    }

    const supply = BigInt(totalSupply) * BigInt(10 ** 18);
    const sale = BigInt(tokensForSale) * BigInt(10 ** 18);
    const price = BigInt(Math.floor(parseFloat(basePrice) * 1e18));
    const coeff = BigInt(Math.floor(parseFloat(curveCoefficient) * 1e18));
    const threshold = BigInt(migrationThreshold) * BigInt(10 ** 18);

    writeContract({
      address: factoryAddress,
      abi: FACTORY_ABI,
      functionName: "createToken",
      args: [name, symbol, supply, sale, price, coeff, threshold, 18],
      value: BigInt(Math.floor(parseFloat(creationFee) * 1e18)),
    });
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
            <input className="input-field" type="number" step="any" value={curveCoefficient} onChange={e => setCurveCoefficient(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Migration Threshold (IOPN)</label>
            <input className="input-field" type="number" value={migrationThreshold} onChange={e => setMigrationThreshold(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Creation Fee</label>
            <input className="input-field" value={`${creationFee} IOPN`} disabled />
          </div>
        </div>

        {/* Curve Preview */}
        <div className="bg-gray-900 rounded-lg p-4 text-sm">
          <p className="text-gray-400 mb-1">Bonding Curve Preview (first 5 buys with 1 IOPN each)</p>
          {[1, 2, 3, 4, 5].map((n) => {
            const bp = parseFloat(basePrice) || 0.0001;
            const cc = parseFloat(curveCoefficient) || 0.00000001;
            const prevSupply = (n - 1) * 10000;
            const price = bp + prevSupply * cc;
            return (
              <div key={n} className="flex justify-between text-gray-500">
                <span>Buy {n > 1 ? `1 IOPN after ${(n - 1) * 10000} supply` : "1 IOPN"}</span>
                <span>Price: {price.toExponential(4)} IOPN</span>
                <span>Tokens: {Math.floor(1 / price).toLocaleString()}</span>
              </div>
            );
          })}
        </div>

        <button
          className="btn-primary w-full"
          onClick={handleCreate}
          disabled={isPending || !name || !symbol}
        >
          {isPending ? "Confirming..." : "Create Token"}
        </button>

        {hash && (
          <div className="text-green-400 text-sm mt-2">
            {isConfirming ? "Waiting for confirmation..." : isConfirmed ? "Token created successfully!" : "Transaction sent"}
            <a href={`https://testnet.iopn.tech/tx/${hash}`} target="_blank" className="underline ml-2">
              Explorer
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
