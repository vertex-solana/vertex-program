use anchor_lang::prelude::*;

#[account]
#[derive(Debug, InitSpace)]
pub struct SystemAuthority {
  pub bump: u8,
}
