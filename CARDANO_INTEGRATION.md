# Cardano Lace Wallet Integration Guide

## Overview

This escrow smart contract platform integrates with **Cardano's Lace wallet** to enable real on-chain fund locking and multi-signature approvals on the **Preprod testnet**.

## Architecture

### Frontend Components

**`useCardanoWallet` Hook** (`client/src/hooks/useCardanoWallet.ts`)
- Manages Lace wallet connection state
- Handles wallet detection and initialization
- Provides methods for signing and submitting transactions
- Auto-connects if wallet is already enabled

**`WalletConnect` Component** (`client/src/components/WalletConnect.tsx`)
- Displays wallet connection status
- Shows address, network, and balance
- Provides connect/disconnect buttons
- Integrated into Dashboard for easy access

### Backend Services

**Cardano Configuration** (`server/cardano/contract.ts`)
- Defines Plutus V2 smart contract structure
- Specifies EscrowDatum and EscrowAction types
- Contains testnet configuration (Blockfrost, Preprod network)
- Placeholder for compiled Plutus script CBOR

**Wallet Integration** (`server/cardano/wallet.ts`)
- Initializes Lucid with Blockfrost provider
- Provides utilities for querying UTxOs
- Manages network parameters
- Handles transaction building

## Getting Started

### Prerequisites

1. **Lace Wallet**: Install from [lace.io](https://www.lace.io)
2. **Preprod Testnet**: Switch your wallet to Preprod (testnet)
3. **Test ADA**: Get test funds from [Cardano Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet)
4. **Blockfrost API Key**: Get from [blockfrost.io](https://blockfrost.io) (free tier available)

### Setup Steps

1. **Add Blockfrost API Key to Environment**
   ```bash
   # In your .env or settings
   BLOCKFROST_API_KEY=your_api_key_here
   ```

2. **Connect Your Wallet**
   - Navigate to Dashboard
   - Click "CONNECT LACE WALLET"
   - Approve the connection in your Lace wallet
   - Verify you're on Preprod testnet

3. **Deploy Smart Contract** (Future)
   - Compile Haskell Plutus code to CBOR
   - Deploy to Preprod testnet
   - Update `SCRIPT_HASH` and `CONTRACT_ADDRESS` in `server/cardano/contract.ts`

## Smart Contract Logic

The Plutus V2 validator enforces three main operations:

### Approve (Redeemer = 0)
- **Who**: Authorized officials only
- **When**: Before deadline
- **Validation**:
  - Signer must be in officials list
  - Signer must not have already approved
  - Current time must be before deadline
- **Effect**: Updates datum with new approval, keeps funds locked

### Release (Redeemer = 1)
- **Who**: Beneficiary only
- **When**: Before deadline AND approvals >= required
- **Validation**:
  - Beneficiary must sign transaction
  - Approval count must meet threshold
  - Current time must be before deadline
- **Effect**: Transfers funds to beneficiary address

### Refund (Redeemer = 2)
- **Who**: Depositor only
- **When**: After deadline AND approvals < required
- **Validation**:
  - Depositor must sign transaction
  - Approval count must be insufficient
  - Current time must be after deadline
- **Effect**: Returns funds to depositor address

## Transaction Flow

### 1. Lock Funds (Database + Blockchain)

```
User (Depositor) → Lock Funds Form
  ↓
Backend: Create escrow record in database
  ↓
Backend: Build Cardano transaction
  ↓
Frontend: Sign with Lace wallet
  ↓
Frontend: Submit signed transaction
  ↓
Blockchain: Funds locked at script address
  ↓
Backend: Record transaction in history
```

### 2. Approve (Database + Blockchain)

```
Official → Dashboard → Approve Button
  ↓
Backend: Verify official is authorized
  ↓
Backend: Build approval transaction
  ↓
Frontend: Sign with Lace wallet
  ↓
Frontend: Submit signed transaction
  ↓
Blockchain: Datum updated with approval
  ↓
Backend: Record approval in database
```

### 3. Release (Database + Blockchain)

```
Beneficiary → Escrow Details → Release Button
  ↓
Backend: Verify approvals >= required
  ↓
Backend: Verify before deadline
  ↓
Backend: Build release transaction
  ↓
Frontend: Sign with Lace wallet
  ↓
Frontend: Submit signed transaction
  ↓
Blockchain: Funds transferred to beneficiary
  ↓
Backend: Update status to "released"
```

### 4. Refund (Database + Blockchain)

```
Depositor → Escrow Details → Refund Button
  ↓
Backend: Verify after deadline
  ↓
Backend: Verify approvals < required
  ↓
Backend: Build refund transaction
  ↓
Frontend: Sign with Lace wallet
  ↓
Frontend: Submit signed transaction
  ↓
Blockchain: Funds returned to depositor
  ↓
Backend: Update status to "refunded"
```

## API Endpoints

### Escrow Operations

```typescript
// Lock funds
POST /api/trpc/escrow.lock
Input: {
  beneficiaryId: number
  officialIds: number[]
  amount: string (in lovelace)
  requiredApprovals: number
  deadlineMs: number
  description?: string
}

// Approve escrow
POST /api/trpc/escrow.approve
Input: {
  contractId: string
  blockchainTxHash?: string
}

// Release funds
POST /api/trpc/escrow.release
Input: {
  contractId: string
  blockchainTxHash?: string
}

// Refund funds
POST /api/trpc/escrow.refund
Input: {
  contractId: string
  blockchainTxHash?: string
}

// Get all escrows
GET /api/trpc/escrow.getAllEscrows

// Get escrow details
GET /api/trpc/escrow.getEscrowDetails?contractId=...

// Get transaction history
GET /api/trpc/escrow.getTransactionHistory?contractId=...
```

## Testing

Run the test suite:
```bash
pnpm test
```

Tests cover:
- ✅ Escrow creation and retrieval
- ✅ Official approvals with validation
- ✅ Duplicate approval prevention
- ✅ Release with sufficient approvals
- ✅ Release prevention with insufficient approvals
- ✅ Non-beneficiary release prevention
- ✅ Refund after deadline
- ✅ Refund prevention before deadline
- ✅ Cardano wallet integration
- ✅ Transaction history logging

## Deployment Checklist

- [ ] Compile Plutus smart contract to CBOR
- [ ] Deploy contract to Preprod testnet
- [ ] Update `SCRIPT_HASH` in `server/cardano/contract.ts`
- [ ] Update `CONTRACT_ADDRESS` in `server/cardano/contract.ts`
- [ ] Set `BLOCKFROST_API_KEY` environment variable
- [ ] Test all workflows with real Lace wallet
- [ ] Verify transaction history on Cardano explorer
- [ ] Switch to Mainnet configuration for production
- [ ] Update wallet to Mainnet before going live

## Troubleshooting

### Wallet Not Detected
- Ensure Lace wallet is installed and enabled
- Check browser console for errors
- Refresh page after installing wallet

### Wrong Network Error
- Switch Lace wallet to Preprod testnet
- Verify network ID is 0 (Preprod) not 1 (Mainnet)

### Transaction Failed
- Check Blockfrost API key is valid
- Verify sufficient balance for fees (min 0.2 ADA)
- Check transaction details in Cardano explorer

### Insufficient Funds
- Get test ADA from [Cardano Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet)
- Wait for transaction confirmation
- Check balance in Lace wallet

## Future Enhancements

1. **Smart Contract Compilation**
   - Integrate Plutus compiler
   - Auto-generate CBOR from Haskell code
   - Deploy to testnet/mainnet

2. **Advanced Features**
   - Time-locked refunds with automatic execution
   - Partial releases with multiple beneficiaries
   - Custom approval conditions

3. **User Experience**
   - Transaction status notifications
   - Real-time blockchain confirmation tracking
   - Mobile wallet support (Eternl, Nami)

4. **Security**
   - Multi-sig wallet support
   - Audit logging and compliance
   - Rate limiting and DOS protection

## Resources

- [Cardano Developer Portal](https://developers.cardano.org)
- [Lucid Documentation](https://lucid.spacebudz.com)
- [Lace Wallet](https://www.lace.io)
- [Blockfrost API](https://blockfrost.io)
- [Plutus V2 Guide](https://github.com/input-output-hk/plutus-apps)
