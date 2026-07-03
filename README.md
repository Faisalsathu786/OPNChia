# OPNChia — Pump.fun Style Bonding Curve Launchpad on OPN Chain

A decentralized token launchpad with bonding curve pricing on OPN Chain (IOPn).

## Features

- **1-Click Token Creation** — Deploy token + bonding curve in one transaction
- **Bonding Curve Pricing** — Price increases as more people buy (fair launch)
- **Instant Trading** — Buy/sell tokens directly against the bonding curve
- **Auto-Migration** — When threshold hits, liquidity migrates to DEX
- **Fully On-Chain** — No backend, no custody, transparent

## Smart Contracts

| Contract | Purpose |
|----------|---------|
| OPNChiaFactory.sol | Creates tokens + bonding curves |
| OPNChiaBondingCurve.sol | Bonding curve math — buy/sell |
| OPNChiaMigrator.sol | Auto-migrates liquidity to DEX |
| OPNChiaToken.sol | Standard ERC-20 (mintable/burnable) |

## Setup

### Prerequisites
- Node.js 18+
- MetaMask with OPN Testnet added

### Backend (Smart Contracts)

```bash
cd backend
npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.ts --network opnTestnet
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## OPN Chain Config

| Parameter | Value |
|-----------|-------|
| Network Name | OPN Testnet |
| RPC URL | https://testnet-rpc2.iopn.tech |
| Chain ID | 984 |
| Symbol | IOPN |
| Explorer | https://testnet.iopn.tech |

## Bonding Curve Formula

```
price = basePrice + (currentSupply * curveCoefficient)
```

## Season 1 — DeFi & Open Finance
- Submissions: May 28 – Jun 21, 2026
- Finale: Jul 15, 2026
- Submit at: https://builders.iopn.tech

## Links
- Builders Dashboard: https://builders.iopn.tech
- IOPn Docs: https://iopn.gitbook.io/iopn
- OPN Faucet: https://faucet.iopn.tech
