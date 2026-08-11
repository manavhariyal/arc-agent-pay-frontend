# Arc Agent Pay — Frontend

Payments infrastructure for autonomous AI agents. Fund, monitor, and control AI agent USDC payments on Arc Testnet, built with Circle's Developer Controlled Wallets.

**Live app:** [arcagentpay.xyz](https://arcagentpay.xyz)
**x402 autonomous micropayments demo:** [arcagentpay.xyz/x402-demo](https://arcagentpay.xyz/x402-demo)

## What this is

Arc Agent Pay lets AI agents make onchain USDC payments on their own, within spending rules you define, without a human approving every transaction. You register an agent, set a spending limit and recipient, fund it, and the agent handles payments automatically — with an auto-pause safety net if the funded balance runs low.

It also includes a working implementation of **x402**, letting an agent autonomously discover a paywalled resource, pay a sub-cent USDC fee through Circle's Gateway facilitator, and unlock the resource — fully automatic, zero manual signing.

## Features

- Agent registration and spending rule management
- Scheduled, automatic USDC payments via Circle's Developer Controlled Wallets
- Real-time balance tracking and auto-pause on insufficient funds
- Multi-wallet support (MetaMask + WalletConnect) with proper EIP-6963 multi-provider detection
- Mobile-responsive UI
- x402 + Circle Gateway integration for autonomous micropayments
- Live onchain transaction history, per-agent and account-wide

## Tech stack

- React + TypeScript, Vite
- Tailwind CSS
- wagmi / viem for wallet + chain interaction
- Supabase for data persistence
- Deployed on Vercel

## Related repos

- Backend: [arc-agent-pay-backend](https://github.com/manavhariyal/arc-agent-pay-backend)

## Network

Arc Testnet — Chain ID `5042002`

## Local development

```bash
npm install
npm run dev
```

Requires a `.env` matching the variables in `.env.example`.
