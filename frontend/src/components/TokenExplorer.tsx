interface Props {
  onSelectToken: (address: string) => void;
}

// Demo token data
const DEMO_TOKENS = [
  {
    address: "0x263D9D9B1e26dE17e78D3b5DD919d49638Bad130",
    name: "StormChain",
    symbol: "STORM",
    creator: "bath14",
    price: "0.00000015",
    supply: "45.2M",
    raised: "6.8",
    target: "10",
    change: "+12.5%",
    color: "#7C3AED",
  },
  {
    address: "0xe1D9598Dd692c8a2a773B883616a79E4DeD40Dd9",
    name: "OPN VaultGuard",
    symbol: "VGD",
    creator: "harley7317",
    price: "0.00000008",
    supply: "22.1M",
    raised: "3.5",
    target: "10",
    change: "+8.2%",
    color: "#10B981",
  },
  {
    address: "0x7e5c2C...DD2006",
    name: "IOPn Portal Hub",
    symbol: "IPH",
    creator: "—",
    price: "0.00000012",
    supply: "30.0M",
    raised: "5.1",
    target: "10",
    change: "+5.7%",
    color: "#F59E0B",
  },
  {
    address: "0xcC893d...fBE7Fd",
    name: "IOPn Dex",
    symbol: "IDEX",
    creator: "—",
    price: "0.00000022",
    supply: "50.0M",
    raised: "9.2",
    target: "10",
    change: "+21.3%",
    color: "#EF4444",
  },
  {
    address: "0xAdbC62...4258E9",
    name: "OPN Quest Hub",
    symbol: "QUEST",
    creator: "—",
    price: "0.00000005",
    supply: "12.5M",
    raised: "1.2",
    target: "10",
    change: "+3.1%",
    color: "#06B6D4",
  },
  {
    address: "0x4F6082...565A5c",
    name: "OPN Staking",
    symbol: "STAKE",
    creator: "—",
    price: "0.00000018",
    supply: "35.0M",
    raised: "7.5",
    target: "10",
    change: "+15.8%",
    color: "#8B5CF6",
  },
];

export default function TokenExplorer({ onSelectToken }: Props) {
  const sorted = [...DEMO_TOKENS].sort((a, b) => parseFloat(b.change) - parseFloat(a.change));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">🔥 Trending Tokens</h2>
        <span className="text-sm text-gray-500">Season 1 · DeFi & Open Finance</span>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Active Tokens", value: "297" },
          { label: "Verified Builders", value: "4.6K+" },
          { label: "Total Raised", value: "1,234 IOPN" },
        ].map((s, i) => (
          <div key={i} className="card text-center py-4">
            <div className="text-2xl font-bold text-purple-400">{s.value}</div>
            <div className="text-sm text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Token cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((token) => {
          const progress = Math.min(100, (parseFloat(token.raised) / parseFloat(token.target)) * 100);
          const isPositive = token.change.startsWith("+");

          return (
            <div
              key={token.address}
              className="card cursor-pointer hover:border-purple-500/50 transition-all"
              onClick={() => onSelectToken(token.address)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: token.color }}>
                      {token.symbol[0]}
                    </div>
                    <div>
                      <h3 className="font-bold">{token.name}</h3>
                      <span className="text-sm text-gray-400">{token.symbol}</span>
                    </div>
                  </div>
                </div>
                <span className={`text-sm font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                  {token.change}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                <div>
                  <div className="text-gray-500">Price</div>
                  <div>{token.price}</div>
                </div>
                <div>
                  <div className="text-gray-500">Supply</div>
                  <div>{token.supply}</div>
                </div>
                <div>
                  <div className="text-gray-500">Raised</div>
                  <div>{token.raised} IOPN</div>
                </div>
              </div>

              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{token.raised} of {token.target} IOPN</span>
                <span>{progress.toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
