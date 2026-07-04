import { useState } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Head from "next/head";
import CreateToken from "@/components/CreateToken";
import TradePanel from "@/components/TradePanel";
import TokenExplorer from "@/components/TokenExplorer";
import MyTokens from "@/components/MyTokens";
import AdminPanel from "@/components/AdminPanel";

type Tab = "explore" | "create" | "trade" | "mytokens" | "admin";

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("explore");
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const { address, isConnected } = useAccount();

  // Factory contract address (update after deploy)
  const FACTORY_ADDRESS = "0x46B756f6A9A1e1833843c59639cC61f4459f397F";
  const ADMIN_ADDRESS = "0x6c9d7E75d1bb911CC8351f08EBac7261452587FB";


  const tabs: { key: Tab; label: string }[] = [
    { key: "explore", label: "Explore Tokens" },
    { key: "create", label: "Create Token" },
    { key: "trade", label: "Trade" },
    { key: "mytokens", label: "My Tokens" },
    ...(address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase() ? [{ key: "admin" as Tab, label: "Admin" }] : []),
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
          <span className="text-xl font-bold text-white">OPNChia</span>
          <span className="text-xs text-gray-500 ml-2">OPN Chain</span>
        </div>
        <div className="flex items-center gap-4">
          <ConnectButton />
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
        {!isConnected ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-2">Welcome to OPNChia</h2>
            <p className="text-gray-400 mb-6">
              Create and trade tokens on OPN Chain with bonding curve pricing
            </p>
            <ConnectButton />
          </div>
        ) : (
          <>
            {activeTab === "explore" && (
              <TokenExplorer onSelectToken={(addr) => { setSelectedToken(addr); setActiveTab("trade"); }} factoryAddress={FACTORY_ADDRESS} />
            )}
            {activeTab === "create" && <CreateToken factoryAddress={FACTORY_ADDRESS as `0x${string}`} />}
            {activeTab === "trade" && (
              <TradePanel selectedToken={selectedToken} onSelectToken={setSelectedToken} />
            )}
            {activeTab === "mytokens" && <MyTokens factoryAddress={FACTORY_ADDRESS} />}
            {activeTab === "admin" && <AdminPanel factoryAddress={FACTORY_ADDRESS} adminAddress={ADMIN_ADDRESS} />}
          </>
        )}
      </div>
    </div>
  );
}
