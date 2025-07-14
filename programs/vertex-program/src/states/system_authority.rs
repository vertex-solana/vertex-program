use anchor_lang::prelude::*;

#[account]
#[derive(Debug, InitSpace)]
pub struct SystemAuthority {
  pub bump: u8,
  pub rent_lamports: u64,
}

impl SystemAuthority {
  pub fn init(&mut self, bump: u8, rent_lamports: u64) {
    self.bump = bump;
    self.rent_lamports = rent_lamports;
  }
}
