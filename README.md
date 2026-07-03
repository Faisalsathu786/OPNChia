# 🔥 OPNChia

Bonding curve token launchpad on OPN Chain. Create tokens in one click, trade them on a dynamic curve.

## What It Does

OPNChia lets anyone deploy an ERC-20 token with a bonding curve in a single transaction. Price starts low and increases with each buy. When enough liquidity accumulates, the curve auto-migrates to a DEX pool.

- **1-click token creation**
- **Dynamic bonding curve pricing**
- **Buy / sell against the curve**
- **Auto-migration to DEX at threshold**

## Contracts

| Contract | Purpose |
|----------|---------|
| `OPNChiaFactory.sol` | Deploy tokens + bonding curves |
| `OPNChiaBondingCurve.sol` | Curve math — buy, sell, pricing |
| `OPNChiaMigrator.sol` | Auto liquidity migration |
| `OPNChiaToken.sol` | ERC-20 (mintable / burnable) |

## Tech Stack

**Smart Contracts:** Solidity 0.8.24 · Hardhat · OpenZeppelin

**Frontend:** Next.js · Tailwind CSS · wagmi · viem · RainbowKit

## Getting Started

### Prerequisites

- Node.js 18+
- MetaMask

### Install & Compile

```bash
git clone https://github.com/Faisalsathu786/OPNChia.git
cd OPNChia
npm install
npx hardhat compile
```

### Run Tests

```bash
npx hardhat test
```

### Deploy

Create a `.env` file:

```
PRIVATE_KEY=your_wallet_private_key
```

```bash
npx hardhat run scripts/deploy.ts --network opnTestnet
```

After deploy, copy the Factory address and update it in `frontend/src/pages/index.tsx`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## OPN Chain

| Config | Value |
|--------|-------|
| Chain ID | 984 |
| RPC | https://testnet-rpc2.iopn.tech |
| Explorer | https://testnet.iopn.tech |
| Faucet | https://faucet.iopn.tech |
| Symbol | IOPN |

## How It Works

```solidity
price = basePrice + (currentSupply * curveCoefficient)
```

1. Creator pays a creation fee and deploys token + bonding curve
2. Buyers send IOPN → receive tokens at current curve price
3. Price increases as supply grows (every buy makes it more expensive)
4. Sellers can sell tokens back → IOPN returned at current curve price
5. When `totalRaised >= migrationThreshold`, curve auto-finalises

## License

MIT
