import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VertexProgram } from "../target/types/vertex_program";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";
import bs58 from "bs58";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  getAccount,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
  getOrCreateAssociatedTokenAccount,
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  transfer,
} from "@solana/spl-token";
import { log, seeds } from "./utils";
import { assert } from "chai";
import { depositIx, initSystemVaultIx } from "./instructions";
import { initUserVaultIx } from "./instructions/init-user-vault.instruction";

describe("vertex-program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const provider = anchor.getProvider();
  // @ts-ignore
  const providerWallet = provider.wallet.payer as Keypair;
  const connection = new Connection(provider.connection.rpcEndpoint);

  const program = anchor.workspace.VertexProgram as Program<VertexProgram>;

  const USDC_PRIVATEKEY =
    "2B7gLquTwAnDDz3EVtXcGJ9EYyggprQx4GjV7fC5EbTV6zA7kNetg7zAGPT7pVWeH8Gvty7LZ1oNrZ9fECHmZHjk";
  const USDC_KEYPAIR = Keypair.fromSecretKey(bs58.decode(USDC_PRIVATEKEY));
  const USDC_DECIMALS = 6;
  const TOTAL_SUPPLY_USDC = 1_000_000_000 * Math.pow(10, USDC_DECIMALS);
  const usdcMint = USDC_KEYPAIR.publicKey;
  const providerAtaUsdc = getAssociatedTokenAddressSync(
    usdcMint,
    providerWallet.publicKey
  );

  const OPERATOR_PRIVATEKEY =
    "3jQcTZ1HsTTCcPtrRe239FkySAtzUqb526NLSuWsejWUcoHFumi2bck3Szkr5AZS4b2DczN2L2RLFXo6baCxVwb5";
  const operatorKeypair = Keypair.fromSecretKey(
    bs58.decode(OPERATOR_PRIVATEKEY)
  );
  const CREATOR_INDEXER_PRIVATEKEY =
    "4B5BimV9HovYn1GkBbVWxAZbqziith4U4NXVJHFcBL3xdpKf7BwRN1Xtdhr2cfpLaNSjHHrMouvetAs6HYFRo6R2";
  const READER_INDEXER_PRIVATEKEY =
    "3Q5jMP8q5M9dDCzX8wE2CCy3MpSj63o1a4wv9H65ui7KV6JQneLX5UFsNCXaA1yiUo4ahByXX5pS7wZDARPNrRjL";
  const creatorIndexerKeypair = Keypair.fromSecretKey(
    bs58.decode(CREATOR_INDEXER_PRIVATEKEY)
  );
  const readerIndexerKeypair = Keypair.fromSecretKey(
    bs58.decode(READER_INDEXER_PRIVATEKEY)
  );

  xit("Airdrop and create mints", async () => {
    let lamports = await getMinimumBalanceForRentExemptMint(
      new Connection(connection.rpcEndpoint)
    );
    let tx = new anchor.web3.Transaction();

    tx.instructions = [
      SystemProgram.transfer({
        fromPubkey: provider.publicKey,
        toPubkey: operatorKeypair.publicKey,
        lamports: 100 * LAMPORTS_PER_SOL,
      }),

      SystemProgram.transfer({
        fromPubkey: provider.publicKey,
        toPubkey: creatorIndexerKeypair.publicKey,
        lamports: 100 * LAMPORTS_PER_SOL,
      }),

      SystemProgram.transfer({
        fromPubkey: provider.publicKey,
        toPubkey: readerIndexerKeypair.publicKey,
        lamports: 100 * LAMPORTS_PER_SOL,
      }),

      // create USDC token account
      ...[
        SystemProgram.createAccount({
          fromPubkey: provider.publicKey,
          newAccountPubkey: usdcMint,
          lamports,
          space: MINT_SIZE,
          programId: TOKEN_PROGRAM_ID,
        }),

        createInitializeMint2Instruction(
          usdcMint,
          USDC_DECIMALS,
          provider.publicKey,
          null
        ),

        createAssociatedTokenAccountIdempotentInstruction(
          provider.publicKey,
          providerAtaUsdc,
          provider.publicKey,
          usdcMint
        ),

        // mint 1_000_000_000 USDC
        createMintToInstruction(
          usdcMint,
          providerAtaUsdc,
          providerWallet.publicKey,
          TOTAL_SUPPLY_USDC
        ),
      ],
    ];

    await provider
      .sendAndConfirm(tx, [USDC_KEYPAIR, providerWallet])
      .then((sig) => log(connection, sig));

    const creatorIndexerAtaUsdc = await getOrCreateAssociatedTokenAccount(
      connection,
      providerWallet,
      usdcMint,
      creatorIndexerKeypair.publicKey
    );
    const usdcTransferToCreatorIndexer = 1000 * 10 ** USDC_DECIMALS;
    await transfer(
      connection,
      providerWallet,
      providerAtaUsdc,
      creatorIndexerAtaUsdc.address,
      providerWallet,
      usdcTransferToCreatorIndexer
    );

    const readerIndexerAtaUsdc = await getOrCreateAssociatedTokenAccount(
      connection,
      providerWallet,
      usdcMint,
      readerIndexerKeypair.publicKey
    );
    const usdcTransferToReaderIndexer = 1000 * 10 ** USDC_DECIMALS;
    await transfer(
      connection,
      providerWallet,
      providerAtaUsdc,
      readerIndexerAtaUsdc.address,
      providerWallet,
      usdcTransferToReaderIndexer
    );
  });

  xdescribe("Setup System Vault", () => {
    xit("Can not initialize system vault", async () => {
      const randomKeypair = Keypair.generate();

      const tx = new anchor.web3.Transaction();

      // Transfer sol fee
      await provider.sendAndConfirm(
        new anchor.web3.Transaction().add(
          SystemProgram.transfer({
            fromPubkey: provider.publicKey,
            toPubkey: randomKeypair.publicKey,
            lamports: 1 * LAMPORTS_PER_SOL,
          })
        ),
        [providerWallet]
      );

      const systemAuthority = PublicKey.findProgramAddressSync(
        seeds.systemAuthority(),
        program.programId
      )[0];

      const systemVault = getAssociatedTokenAddressSync(
        usdcMint,
        systemAuthority,
        true,
        TOKEN_PROGRAM_ID
      );

      tx.add(
        await initSystemVaultIx(provider.connection, {
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          mint: usdcMint,
          operator: randomKeypair.publicKey,
          systemAuthority,
          systemProgram: SystemProgram.programId,
          systemVault,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
      );

      try {
        await provider.sendAndConfirm(tx, [randomKeypair]);
      } catch (error) {
        assert.equal(
          (error.message as string).includes("Invalid operator"),
          true
        );
      }
    });

    xit("Success init system vault", async () => {
      const tx = new anchor.web3.Transaction();

      const systemAuthority = PublicKey.findProgramAddressSync(
        seeds.systemAuthority(),
        program.programId
      )[0];

      const systemVault = getAssociatedTokenAddressSync(
        usdcMint,
        systemAuthority,
        true,
        TOKEN_PROGRAM_ID
      );

      tx.add(
        await initSystemVaultIx(provider.connection, {
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          mint: usdcMint,
          operator: operatorKeypair.publicKey,
          systemAuthority,
          systemProgram: SystemProgram.programId,
          systemVault,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
      );

      await provider.sendAndConfirm(tx, [operatorKeypair]);

      const systemAuthorityAccount =
        await program.account.systemAuthority.fetch(systemAuthority);
      const systemVaultAccount = await getAccount(connection, systemVault);
      assert.equal(systemAuthorityAccount.balance.toNumber(), 0);
      assert.equal(
        systemVaultAccount.owner.toBase58(),
        systemAuthority.toBase58()
      );
    });
  });

  xdescribe("Setup User Vault", () => {
    it("Success init user vault", async () => {
      const tx = new anchor.web3.Transaction();

      const creatorIndexerVault = PublicKey.findProgramAddressSync(
        seeds.userVault(creatorIndexerKeypair.publicKey),
        program.programId
      )[0];

      const readerIndexerVault = PublicKey.findProgramAddressSync(
        seeds.userVault(readerIndexerKeypair.publicKey),
        program.programId
      )[0];

      tx.add(
        await initUserVaultIx(provider.connection, {
          owner: creatorIndexerKeypair.publicKey,
          systemProgram: SystemProgram.programId,
          userVault: creatorIndexerVault,
        }),
        await initUserVaultIx(provider.connection, {
          owner: readerIndexerKeypair.publicKey,
          systemProgram: SystemProgram.programId,
          userVault: readerIndexerVault,
        })
      );

      await provider.sendAndConfirm(tx, [
        creatorIndexerKeypair,
        readerIndexerKeypair,
      ]);

      const creatorIndexerVaultAccount = await program.account.userVault.fetch(
        creatorIndexerVault
      );
      const readerIndexerVaultAccount = await program.account.userVault.fetch(
        readerIndexerVault
      );

      assert.equal(
        creatorIndexerVaultAccount.owner.toBase58(),
        creatorIndexerKeypair.publicKey.toBase58()
      );
      assert.equal(creatorIndexerVaultAccount.depositedAmount.toNumber(), 0);
      assert.equal(creatorIndexerVaultAccount.remainingAmount.toNumber(), 0);

      assert.equal(
        readerIndexerVaultAccount.owner.toBase58(),
        readerIndexerKeypair.publicKey.toBase58()
      );
      assert.equal(readerIndexerVaultAccount.depositedAmount.toNumber(), 0);
      assert.equal(readerIndexerVaultAccount.remainingAmount.toNumber(), 0);
    });
  });

  describe("Deposit", () => {
    it("Success deposit", async () => {
      const tx = new anchor.web3.Transaction();
      const amount = 100 * Math.pow(10, USDC_DECIMALS);

      const creatorIndexerVault = PublicKey.findProgramAddressSync(
        seeds.userVault(creatorIndexerKeypair.publicKey),
        program.programId
      )[0];

      const readerIndexerVault = PublicKey.findProgramAddressSync(
        seeds.userVault(readerIndexerKeypair.publicKey),
        program.programId
      )[0];

      const creatorIndexerVaultAta = getAssociatedTokenAddressSync(
        usdcMint,
        creatorIndexerKeypair.publicKey,
        true,
        TOKEN_PROGRAM_ID
      );

      const readerIndexerVaultAta = getAssociatedTokenAddressSync(
        usdcMint,
        readerIndexerKeypair.publicKey,
        true,
        TOKEN_PROGRAM_ID
      );

      const creatorIndexerVaultAccountBefore =
        await program.account.userVault.fetch(creatorIndexerVault);
      const creatorIndexerVaultAtaAccountBefore = await getAccount(
        connection,
        creatorIndexerVaultAta
      );

      const readerIndexerVaultAccountBefore =
        await program.account.userVault.fetch(readerIndexerVault);
      const readerIndexerVaultAtaAccountBefore = await getAccount(
        connection,
        readerIndexerVaultAta
      );

      tx.add(
        await depositIx(provider.connection, {
          amount: new anchor.BN(amount),
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          mint: usdcMint,
          payer: creatorIndexerKeypair.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          userAta: creatorIndexerVaultAta,
          userVault: creatorIndexerVault,
          userVaultAta: creatorIndexerVaultAta,
        }),
        await depositIx(provider.connection, {
          amount: new anchor.BN(amount),
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          mint: usdcMint,
          payer: readerIndexerKeypair.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          userAta: readerIndexerVaultAta,
          userVault: readerIndexerVault,
          userVaultAta: readerIndexerVaultAta,
        })
      );

      await provider.sendAndConfirm(tx, [
        creatorIndexerKeypair,
        readerIndexerKeypair,
      ]);

      const creatorIndexerVaultAccount = await program.account.userVault.fetch(
        creatorIndexerVault
      );
      const readerIndexerVaultAccount = await program.account.userVault.fetch(
        readerIndexerVault
      );
      const creatorIndexerAtaAccount = await connection.getTokenAccountBalance(
        creatorIndexerVaultAta
      );
      const readerIndexerAtaAccount = await connection.getTokenAccountBalance(
        readerIndexerVaultAta
      );

      assert.equal(
        creatorIndexerVaultAccount.depositedAmount.toNumber(),
        creatorIndexerVaultAccountBefore.depositedAmount
          .add(new anchor.BN(amount))
          .toNumber()
      );
      assert.equal(
        creatorIndexerVaultAccount.remainingAmount.toNumber(),
        creatorIndexerVaultAccountBefore.remainingAmount
          .add(new anchor.BN(amount))
          .toNumber()
      );
      assert.equal(
        creatorIndexerAtaAccount.value.amount,
        new anchor.BN(creatorIndexerVaultAtaAccountBefore.amount.toString())
          .add(new anchor.BN(amount))
          .toString()
      );

      assert.equal(
        readerIndexerVaultAccount.depositedAmount.toNumber(),
        readerIndexerVaultAccountBefore.depositedAmount
          .add(new anchor.BN(amount))
          .toNumber()
      );
      assert.equal(
        readerIndexerVaultAccount.remainingAmount.toNumber(),
        readerIndexerVaultAccountBefore.remainingAmount
          .add(new anchor.BN(amount))
          .toNumber()
      );
      assert.equal(
        readerIndexerAtaAccount.value.amount,
        new anchor.BN(readerIndexerVaultAtaAccountBefore.amount.toString())
          .add(new anchor.BN(amount))
          .toString()
      );
    });
  });
});
