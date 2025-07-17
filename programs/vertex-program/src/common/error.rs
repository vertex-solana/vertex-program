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

  #[msg("Overflow")]
  Overflow,

  #[msg("Read debt limit")]
  ReadDebtLimit,

  #[msg("User not have enough amount to deposit")]
  UserNotHaveEnoughAmountToDeposit,

  #[msg("Wrong mint token fee")]
  WrongMintTokenFee,

  #[msg("Invalid amount deposit")]
  InvalidAmountDeposit,

  #[msg("Invalid operator")]
  InvalidOperator,

  #[msg("Not enough remaining amount")]
  NotEnoughRemainingAmount,

  #[msg("Insufficient funds in indexer vault")]
  InsufficientFundsInIndexerVault,

  #[msg("Insufficient funds in system vault")]
  InsufficientFundsInSystemVault,
}
