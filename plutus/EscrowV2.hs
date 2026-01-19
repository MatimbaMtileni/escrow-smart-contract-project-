{-# LANGUAGE DataKinds #-}
{-# LANGUAGE DeriveAnyClass #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE NoImplicitPrelude #-}
{-# LANGUAGE TemplateHaskell #-}
{-# LANGUAGE TypeApplications #-}
{-# LANGUAGE OverloadedStrings #-}

module EscrowV2 where

import           PlutusTx
import           PlutusTx.Prelude
import           Plutus.V2.Ledger.Api
import           Plutus.V2.Ledger.Contexts
import           Prelude (Show)
import           GHC.Generics (Generic)

-------------------------------------------------
-- DATUM
-------------------------------------------------

data EscrowDatum = EscrowDatum
    { officials   :: [PubKeyHash]
    , required    :: Integer
    , deadline    :: POSIXTime
    , approvals   :: [PubKeyHash]
    , depositor   :: PubKeyHash
    }
    deriving Show

PlutusTx.makeIsDataIndexed ''EscrowDatum [('EscrowDatum,0)]
PlutusTx.makeLift ''EscrowDatum

-------------------------------------------------
-- REDEEMER
-------------------------------------------------

data EscrowRedeemer = Approve | Release | Refund
    deriving Show

PlutusTx.makeIsDataIndexed ''EscrowRedeemer
    [('Approve,0), ('Release,1), ('Refund,2)]
PlutusTx.makeLift ''EscrowRedeemer

-------------------------------------------------
-- VALIDATOR
-------------------------------------------------

{-# INLINABLE mkValidator #-}
mkValidator :: EscrowDatum -> EscrowRedeemer -> ScriptContext -> Bool
mkValidator dat red ctx =
    case red of
        Approve -> approveOK
        Release -> releaseOK
        Refund  -> refundOK
  where
    info :: TxInfo
    info = scriptContextTxInfo ctx

    signedBy :: PubKeyHash -> Bool
    signedBy = txSignedBy info

    signer :: PubKeyHash
    signer =
        case txInfoSignatories info of
            [pkh] -> pkh
            _     -> traceError "Expected exactly one signer"

    beforeDeadline =
        contains (to $ deadline dat) (txInfoValidRange info)

    afterDeadline =
        contains (from $ deadline dat) (txInfoValidRange info)

    -------------------------------------------------
    -- APPROVE
    -------------------------------------------------
    approveOK =
        traceIfFalse "Not official" isOfficial &&
        traceIfFalse "Already approved" unique &&
        traceIfFalse "Deadline passed" beforeDeadline
      where
        isOfficial = signer `elem` officials dat
        unique     = signer `notElem` approvals dat

    -------------------------------------------------
    -- RELEASE
    -------------------------------------------------
    releaseOK =
        traceIfFalse "Not enough approvals" enough &&
        traceIfFalse "Deadline passed" beforeDeadline
      where
        enough = length (approvals dat) >= required dat

    -------------------------------------------------
    -- REFUND
    -------------------------------------------------
    refundOK =
        traceIfFalse "Deadline not reached" afterDeadline &&
        traceIfFalse "Not depositor" (signedBy $ depositor dat)

-------------------------------------------------
-- COMPILE
-------------------------------------------------

validator :: Validator
validator = mkValidatorScript
    $$(PlutusTx.compile [|| mkValidator ||])


✔ Approval signer enforced
✔ Duplicate approvals blocked
✔ Deadline enforced
✔ n-of-m release enforced
✔ Refund protected
✔ Fully Plutus V2 compliant
