{-# LANGUAGE DataKinds #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE TypeApplications #-}
{-# LANGUAGE NoImplicitPrelude #-}

module Contract where

import           Control.Monad        hiding (fmap)
import           Plutus.Contract
import           Ledger
import           Ledger.Value
import qualified Data.Map             as Map
import           Prelude              (Semigroup(..), Show(..), String)
import           EscrowV2

-------------------------------------------------
-- PARAMS
-------------------------------------------------

data DepositParams = DepositParams
    { dpAmount :: Integer
    , dpDatum  :: EscrowDatum
    }

-------------------------------------------------
-- DEPOSIT
-------------------------------------------------

deposit :: AsContractError e => DepositParams -> Contract w s e ()
deposit dp = do
    let tx =
            mustPayToOtherScript
                (validatorHash validator)
                (Datum $ toBuiltinData $ dpDatum dp)
                (lovelaceValueOf $ dpAmount dp)

    submitTx tx
    logInfo @String "Funds deposited"

-------------------------------------------------
-- APPROVE (UPDATES DATUM)
-------------------------------------------------

approve :: Contract w s Text ()
approve = do
    pkh   <- ownPaymentPubKeyHash
    utxos <- utxosAt (scriptAddress validator)

    case Map.toList utxos of
        [(oref, o)] -> do
            let Just dat = getDatum o
                newDatum = dat { approvals = pkh : approvals dat }

                tx =
                    mustSpendScriptOutput oref (Redeemer $ toBuiltinData Approve) <>
                    mustPayToOtherScript
                        (validatorHash validator)
                        (Datum $ toBuiltinData newDatum)
                        (txOutValue o)

            submitTx tx
            logInfo @String "Approval recorded"

        _ -> throwError "Expected exactly one escrow UTXO"

-------------------------------------------------
-- RELEASE / REFUND
-------------------------------------------------

spend :: EscrowRedeemer -> Contract w s Text ()
spend red = do
    utxos <- utxosAt (scriptAddress validator)

    case Map.toList utxos of
        [(oref, _)] -> do
            let tx = mustSpendScriptOutput oref (Redeemer $ toBuiltinData red)
            submitTx tx
            logInfo @String "Escrow spent"

        _ -> throwError "Expected exactly one escrow UTXO"

-------------------------------------------------
-- ENDPOINTS
-------------------------------------------------

type EscrowSchema =
        Endpoint "deposit" DepositParams
    .\/ Endpoint "approve" ()
    .\/ Endpoint "release" ()
    .\/ Endpoint "refund" ()

endpoints :: Contract () EscrowSchema Text ()
endpoints =
    awaitPromise
        ( deposit' `select`
          approve' `select`
          release' `select`
          refund' )
  where
    deposit' = endpoint @"deposit" deposit
    approve' = endpoint @"approve" $ const approve
    release' = endpoint @"release" $ const (spend Release)
    refund'  = endpoint @"refund"  $ const (spend Refund)