use anchor_lang::prelude::*;

declare_id!("9bRE8rbemawE439Fyh91LSnG83hrsSaGg4pjuJ7CpEPT");

#[program]
pub mod vertex_program {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
