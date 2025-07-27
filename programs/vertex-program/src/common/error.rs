use anchor_lang::prelude::*;

#[error_code]
pub enum VertexError {
  #[msg("Invalid account data")]
  InvalidAccountData,

  #[msg("Wrong user vault")]
  WrongUserVault,

  #[msg("User vault already delegated")]
  UserVaultHadDelegated,

  #[msg("User vault must be delegated")]
  UserVaultMustDelegated,

  #[msg("Invalid owner of user vault")]
  InvalidOwnerOfUserVault,

  #[msg("Require indexer")]
  RequireIndexer,

  #[msg("Invalid indexer")]
  InvalidIndexer,

  #[msg("Overflow")]
  Overflow,

  #[msg("Read debt limit")]
  ReadDebtLimit,

  #[msg("User vault is in billing process")]
  UserVaultIsInBillingProcess,

  #[msg("User vault not in billing process")]
  UserVaultNotInBillingProcess,

  #[msg("User vault not touch threshold")]
  UserVaultNotTouchThreshold,

  #[msg("User not have enough amount to deposit")]
  UserNotHaveEnoughAmountToDeposit,

  #[msg("Wrong mint token fee")]
  WrongMintTokenFee,

  #[msg("Invalid amount deposit")]
  InvalidAmountDeposit,

  #[msg("Invalid operator")]
  InvalidOperator,

  #[msg("Insufficient funds in user vault for charge fee")]
  InsufficientFundsInUserVaultForChargeFee,

  #[msg("Not enough remaining account read debt")]
  NotEnoughRemainingAccountReadDebt,

  #[msg("Insufficient funds in indexer vault")]
  InsufficientFundsInIndexerVault,

  #[msg("Insufficient funds in system vault")]
  InsufficientFundsInSystemVault,

  #[msg("Invalid indexer price for read")]
  InvalidIndexerPriceForRead,
}
