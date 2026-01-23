# Cardano Escrow Smart Contract Deployment Guide

This guide explains how to deploy the Plutus smart contract to Cardano Preprod testnet and configure the platform for on-chain transactions.

## Prerequisites

1. **Cardano CLI** - Install from [cardano-cli releases](https://github.com/input-output-hk/cardano-cli/releases)
2. **Plutus Tools** - Haskell GHC and Cabal for compiling Plutus contracts
3. **Blockfrost API Key** - Get from [blockfrost.io](https://blockfrost.io) (select Preprod network)
4. **Test ADA** - Request from [Cardano Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet)

## Step 1: Compile Plutus Contract to CBOR

The Haskell Plutus contract needs to be compiled to CBOR format for deployment.

```bash
# If you have the Haskell contract source
cabal build
cabal run -- plutus-to-cbor your-contract.hs > contract.cbor
```

Or if using a pre-compiled contract:

```bash
# Convert hex to CBOR if needed
echo "your_hex_string" | xxd -r -p > contract.cbor
```

## Step 2: Create Cardano Address for Smart Contract

Generate a payment address for the script:

```bash
# Generate keys
cardano-cli address key-gen \
  --verification-key-file payment.vkey \
  --signing-key-file payment.skey

# Create address
cardano-cli address build \
  --payment-verification-key-file payment.vkey \
  --out-file payment.addr \
  --testnet-magic 1

# Get the address
cat payment.addr
```

## Step 3: Deploy Script to Blockchain

Create a transaction that registers the script:

```bash
# Get current UTXOs
cardano-cli query utxo \
  --address $(cat payment.addr) \
  --testnet-magic 1 \
  --out-file utxos.json

# Build transaction
cardano-cli transaction build \
  --testnet-magic 1 \
  --tx-in <UTXO_FROM_ABOVE> \
  --tx-out $(cat payment.addr)+2000000 \
  --script-file contract.cbor \
  --out-file tx.raw

# Sign transaction
cardano-cli transaction sign \
  --tx-body-file tx.raw \
  --signing-key-file payment.skey \
  --testnet-magic 1 \
  --out-file tx.signed

# Submit transaction
cardano-cli transaction submit \
  --tx-file tx.signed \
  --testnet-magic 1
```

## Step 4: Get Script Hash and Address

```bash
# Get script hash
cardano-cli script hash --script-file contract.cbor

# Create script address
cardano-cli address build \
  --payment-script-file contract.cbor \
  --out-file script.addr \
  --testnet-magic 1

# Get the script address
cat script.addr
```

## Step 5: Update Configuration

Update `server/cardano/contract.js` with your deployed contract details:

```typescript
export const CARDANO_CONFIG = {
  network: "preprod",
  blockfrostApiKey: process.env.BLOCKFROST_API_KEY || "",
  
  // Update these with your deployed contract
  CONTRACT_ADDRESS: "addr_test1...", // Script address from step 4
  SCRIPT_HASH: "abcd1234...",         // Script hash from step 4
  
  minFee: 200000,
  utxoSize: 4000,
};
```

## Step 6: Test Transaction Flow

1. **Connect Lace Wallet** - Click "CONNECT LACE WALLET" button
2. **Request Test ADA** - Get from [Cardano Faucet](https://docs.cardano.org/cardano-testnet/tools/faucet)
3. **Create Escrow** - Fill form and click "LOCK FUNDS"
4. **Sign Transaction** - Approve in Lace wallet
5. **Monitor Status** - View transaction on [Cardano Preprod Explorer](https://preprod.cexplorer.io)

## Verification

Check if your contract is deployed:

```bash
# Query script address UTXOs
cardano-cli query utxo \
  --address $(cat script.addr) \
  --testnet-magic 1
```

## Troubleshooting

### "Script not found" error
- Verify script address is correct
- Check script CBOR file is valid
- Ensure transaction was confirmed on-chain

### "Insufficient funds" error
- Request more test ADA from faucet
- Wait for previous transaction to confirm
- Check UTXOs: `cardano-cli query utxo --address $(cat payment.addr) --testnet-magic 1`

### Transaction fails to submit
- Check Blockfrost API key is valid
- Verify network is set to Preprod (testnet-magic 1)
- Ensure transaction is properly signed

## Production Deployment

For mainnet deployment:

1. Change `testnet-magic 1` to mainnet parameters
2. Use mainnet Blockfrost API key
3. Deploy with real ADA (not test ADA)
4. Update `CARDANO_CONFIG.network` to "mainnet"
5. Test thoroughly on testnet first

## References

- [Cardano Documentation](https://docs.cardano.org)
- [Plutus Documentation](https://plutus.readthedocs.io)
- [Blockfrost API](https://blockfrost.io/api/docs)
- [Cardano CLI Guide](https://github.com/input-output-hk/cardano-cli)
