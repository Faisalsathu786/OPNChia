import { useState, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Head from "next/head";
import CreateToken from "@/components/CreateToken";
import TradePanel from "@/components/TradePanel";
import TokenExplorer from "@/components/TokenExplorer";
import MyTokens from "@/components/MyTokens";

type Tab = "explore" | "create" | "trade" | "mytokens";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("explore");
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const { address, isConnected } = useAccount();

  // Factory contract address (update after deploy)
  const FACTORY_ADDRESS = "0x0000000000000000000000000000000000000000";

  // Demo mode — show UI without wallet
  const [demoMode, setDemoMode] = useState(false);

  const tabs: { key: Tab; label: string }[] = [
    { key: "explore", label: "🔥 Explore" },
    { key: "create", label: "✨ Create Token" },
    { key: "trade", label: "📊 Trade" },
    { key: "mytokens", label: "👛 My Tokens" },
  ];

  return (
    <div className="min-h-screen">
      <Head>
        <title>OPNChia — Token Launchpad on OPN Chain</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <span className="text-xl font-bold text-white">OPNChia</span>
          <span className="text-xs text-gray-500 ml-2">OPN Chain</span>
        </div>
        <div className="flex items-center gap-4">
          {!demoMode && <ConnectButton />}
          <button
            className="text-xs text-gray-500 hover:text-gray-300"
            onClick={() => setDemoMode(!demoMode)}
          >
            {demoMode ? "🔗 Connect Mode" : "🧪 Demo Mode"}
          </button>
        </div>
      </nav>

      {/* Tabs */}
      <div className="flex justify-center gap-2 px-4 pt-6 border-b border-gray-800">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => {
              setActiveTab(t.key);
              if (t.key !== "trade") setSelectedToken(null);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {!isConnected && !demoMode ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔥</div>
            <h2 className="text-2xl font-bold mb-2">Welcome to OPNChia</h2>
            <p className="text-gray-400 mb-6">
              Create and trade tokens on OPN Chain with bonding curve pricing
            </p>
            <ConnectButton />
            <div className="mt-4">
              <button
                className="text-sm text-gray-500 underline"
                onClick={() => setDemoMode(true)}
              >
                Or try demo mode
              </button>
            </div>
          </div>
        ) : (
          <>
            {activeTab === "explore" && (
              <TokenExplorer onSelectToken={(addr) => { setSelectedToken(addr); setActiveTab("trade"); }} />
            )}
            {activeTab === "create" && <CreateToken factoryAddress={FACTORY_ADDRESS} />}
            {activeTab === "trade" && (
              <TradePanel selectedToken={selectedToken} onSelectToken={setSelectedToken} />
            )}
            {activeTab === "mytokens" && <MyTokens />}
          </>
        )}
      </div>
    </div>
  );
}
