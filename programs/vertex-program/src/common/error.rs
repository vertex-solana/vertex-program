use anchor_lang::prelude::*;

#[error_code]
pub enum VertexError {
  #[msg("Wrong mint token fee")]
  WrongMintTokenFee,
  #[msg("Invalid amount deposit")]
  InvalidAmountDeposit,
  #[msg("Invalid operator")]
  InvalidOperator,
  #[msg("Not enough remaining amount")]
  NotEnoughRemainingAmount,
}
