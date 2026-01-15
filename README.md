# Cardano Escrow Smart Contract Project

A full-stack application for managing escrow transactions on the Cardano blockchain using Plutus V2 smart contracts.

## Features

- **Plutus V2 Smart Contracts**: Approval-safe escrow with n-of-m multisig functionality
- **React Frontend**: Modern UI built with TypeScript and Vite
- **Node.js Backend**: tRPC API with database integration
- **Cardano Integration**: Wallet connection, transaction signing, and blockchain interaction
- **Database**: Drizzle ORM with SQLite/PostgreSQL support

## Project Structure

- `plutus/` - Plutus smart contracts (Haskell)
- `client/` - React frontend application
- `server/` - Node.js backend with tRPC
- `shared/` - Shared types and utilities
- `drizzle/` - Database schema and migrations

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Haskell toolchain (for Plutus contracts)
- Cardano CLI
- Blockfrost API key

### Installation

1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up environment variables (see `.env.example`)
4. Run database migrations: `pnpm db:migrate`
5. Start development server: `pnpm dev`

### Smart Contract Deployment

See [SMART_CONTRACT_DEPLOYMENT.md](SMART_CONTRACT_DEPLOYMENT.md) for detailed deployment instructions.

## Technologies

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, tRPC, Drizzle ORM
- **Blockchain**: Cardano, Plutus V2, Blockfrost API
- **Database**: SQLite/PostgreSQL
- **Testing**: Vitest, Playwright

## License

MIT