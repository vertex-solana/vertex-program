import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { VertexProgram } from "../target/types/vertex_program";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
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
import {
  chargeFeeIx,
  depositIx,
  initIndexerIx,
  initSystemVaultIx,
  transferReadFeeIx,
} from "./instructions";
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
    let tx = new Transaction();

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

    const blockhash = await connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash.blockhash;
    tx.feePayer = providerWallet.publicKey;

    await sendAndConfirmTransaction(
      connection,
      tx,
      [USDC_KEYPAIR, providerWallet],
      {
        commitment: "finalized",
      }
    );

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

    it("Success init system vault", async () => {
      const tx = new Transaction();

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

      const blockhash = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash.blockhash;
      tx.feePayer = operatorKeypair.publicKey;

      await sendAndConfirmTransaction(connection, tx, [operatorKeypair], {
        commitment: "finalized",
      });

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
      const tx = new Transaction();

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

      const blockhash = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash.blockhash;
      tx.feePayer = creatorIndexerKeypair.publicKey;

      await sendAndConfirmTransaction(
        connection,
        tx,
        [creatorIndexerKeypair, readerIndexerKeypair],
        {
          commitment: "finalized",
        }
      );

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

  xdescribe("Deposit", () => {
    it("Success deposit", async () => {
      const tx = new Transaction();
      const amount = 1 * Math.pow(10, USDC_DECIMALS);

      const creatorIndexerAta = getAssociatedTokenAddressSync(
        usdcMint,
        creatorIndexerKeypair.publicKey,
        false,
        TOKEN_PROGRAM_ID
      );
      const readerIndexerAta = getAssociatedTokenAddressSync(
        usdcMint,
        readerIndexerKeypair.publicKey,
        false,
        TOKEN_PROGRAM_ID
      );

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
        creatorIndexerVault,
        true,
        TOKEN_PROGRAM_ID
      );

      const readerIndexerVaultAta = getAssociatedTokenAddressSync(
        usdcMint,
        readerIndexerVault,
        true,
        TOKEN_PROGRAM_ID
      );

      const creatorIndexerVaultAccountBefore =
        await program.account.userVault.fetch(creatorIndexerVault);
      let creatorIndexerVaultAtaAccountBeforeAmount: bigint;
      try {
        creatorIndexerVaultAtaAccountBeforeAmount = (
          await getAccount(connection, creatorIndexerVaultAta)
        ).amount;
      } catch (error) {
        creatorIndexerVaultAtaAccountBeforeAmount = BigInt(0);
      }

      const readerIndexerVaultAccountBefore =
        await program.account.userVault.fetch(readerIndexerVault);
      let readerIndexerVaultAtaAccountBeforeAmount: bigint;
      try {
        readerIndexerVaultAtaAccountBeforeAmount = (
          await getAccount(connection, readerIndexerVaultAta)
        ).amount;
      } catch (error) {
        readerIndexerVaultAtaAccountBeforeAmount = BigInt(0);
      }

      tx.add(
        await depositIx(provider.connection, {
          amount: new anchor.BN(amount),
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          mint: usdcMint,
          payer: creatorIndexerKeypair.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          userAta: creatorIndexerAta,
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
          userAta: readerIndexerAta,
          userVault: readerIndexerVault,
          userVaultAta: readerIndexerVaultAta,
        })
      );

      const blockhash = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash.blockhash;

      await sendAndConfirmTransaction(
        connection,
        tx,
        [creatorIndexerKeypair, readerIndexerKeypair],
        {
          commitment: "finalized",
        }
      );

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
        new anchor.BN(creatorIndexerVaultAtaAccountBeforeAmount.toString())
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
        new anchor.BN(readerIndexerVaultAtaAccountBeforeAmount.toString())
          .add(new anchor.BN(amount))
          .toString()
      );
    });
  });

  xdescribe("Indexer", () => {
    it("Success Init Indexer", async () => {
      const tx = new Transaction();

      const indexerId = 1;
      const indexer = PublicKey.findProgramAddressSync(
        seeds.indexer(creatorIndexerKeypair.publicKey, indexerId),
        program.programId
      )[0];

      const indexerVault = getAssociatedTokenAddressSync(
        usdcMint,
        indexer,
        true,
        TOKEN_PROGRAM_ID
      );

      tx.add(
        await initIndexerIx(provider.connection, {
          owner: creatorIndexerKeypair.publicKey,
          indexerId: new anchor.BN(indexerId),
          indexer,
          mint: usdcMint,
          indexerVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
      );

      const blockhash = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash.blockhash;
      await sendAndConfirmTransaction(connection, tx, [creatorIndexerKeypair], {
        commitment: "finalized",
      });

      const indexerAccount = await program.account.indexer.fetch(indexer);

      assert.equal(
        indexerAccount.owner.toBase58(),
        creatorIndexerKeypair.publicKey.toBase58()
      );
      assert.equal(indexerAccount.indexerId.toNumber(), indexerId);
      assert.equal(indexerAccount.balance.toNumber(), 0);

      const indexerVaultAccount = await connection.getTokenAccountBalance(
        indexerVault
      );
      assert.equal(indexerVaultAccount.value.amount, "0");
    });
  });

  xdescribe("Transfer Read Fee", () => {
    const indexerId = 1;
    const indexer = PublicKey.findProgramAddressSync(
      seeds.indexer(creatorIndexerKeypair.publicKey, indexerId),
      program.programId
    )[0];
    const indexerVault = getAssociatedTokenAddressSync(
      usdcMint,
      indexer,
      true,
      TOKEN_PROGRAM_ID
    );

    const payerVault = PublicKey.findProgramAddressSync(
      seeds.userVault(readerIndexerKeypair.publicKey),
      program.programId
    )[0];
    const payerVaultAta = getAssociatedTokenAddressSync(
      usdcMint,
      payerVault,
      true,
      TOKEN_PROGRAM_ID
    );

    it("Can not transfer read fee if not operator", async () => {
      const randomKeypair = Keypair.generate();
      // Transfer sol fee
      let txSendSolFee = new Transaction();
      txSendSolFee.add(
        SystemProgram.transfer({
          fromPubkey: provider.publicKey,
          toPubkey: randomKeypair.publicKey,
          lamports: 1 * LAMPORTS_PER_SOL,
        })
      );
      const blockhash = await connection.getLatestBlockhash();
      txSendSolFee.recentBlockhash = blockhash.blockhash;

      await sendAndConfirmTransaction(
        connection,
        txSendSolFee,
        [providerWallet],
        {
          commitment: "finalized",
        }
      );

      try {
        const tx = new Transaction();

        tx.add(
          await transferReadFeeIx(provider.connection, {
            indexerId: new anchor.BN(indexerId),
            amount: new anchor.BN(1000),
            operator: randomKeypair.publicKey,
            mint: usdcMint,
            indexerOwner: creatorIndexerKeypair.publicKey,
            indexer: indexer,
            indexerVault: indexerVault,
            payerVault,
            payerVaultAta,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
        );

        const blockhash = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash.blockhash;
        await sendAndConfirmTransaction(connection, tx, [randomKeypair], {
          commitment: "finalized",
        });
      } catch (error) {
        assert.equal(
          (error.message as string).includes("Invalid operator"),
          true
        );
      }
    });

    it("Can not transfer read fee if payer vault not enough balance", async () => {
      const currentRemainingAmount = await program.account.userVault.fetch(
        payerVault
      );

      const amountTransferForReadData =
        currentRemainingAmount.remainingAmount.add(new anchor.BN(100));

      try {
        const tx = new Transaction();

        tx.add(
          await transferReadFeeIx(provider.connection, {
            indexerId: new anchor.BN(indexerId),
            amount: amountTransferForReadData,
            operator: operatorKeypair.publicKey,
            mint: usdcMint,
            indexerOwner: creatorIndexerKeypair.publicKey,
            indexer: indexer,
            indexerVault: indexerVault,
            payerVault,
            payerVaultAta,
            tokenProgram: TOKEN_PROGRAM_ID,
          })
        );

        const blockhash = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash.blockhash;
        await sendAndConfirmTransaction(connection, tx, [operatorKeypair], {
          commitment: "finalized",
        });
      } catch (error) {
        assert.equal(
          (error.message as string).includes("Not enough remaining amount"),
          true
        );
      }
    });

    it("Success transfer read fee", async () => {
      const payerVaultBefore = await program.account.userVault.fetch(
        payerVault
      );
      const indexerAccountBefore = await program.account.indexer.fetch(indexer);
      const indexerVaultBefore = await connection.getTokenAccountBalance(
        indexerVault
      );

      const tx = new Transaction();

      tx.add(
        await transferReadFeeIx(provider.connection, {
          indexerId: new anchor.BN(indexerId),
          amount: payerVaultBefore.remainingAmount,
          operator: operatorKeypair.publicKey,
          mint: usdcMint,
          indexerOwner: creatorIndexerKeypair.publicKey,
          indexer: indexer,
          indexerVault: indexerVault,
          payerVault,
          payerVaultAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
      );

      const blockhash = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash.blockhash;
      await sendAndConfirmTransaction(connection, tx, [operatorKeypair], {
        commitment: "finalized",
      });

      const payerVaultAfter = await program.account.userVault.fetch(payerVault);
      console.log("🚀 ~ it ~ payerVaultAfter:", payerVaultAfter);
      const indexerAccountAfter = await program.account.indexer.fetch(indexer);
      console.log("🚀 ~ it ~ indexerAccountAfter:", indexerAccountAfter);
      const indexerVaultAfter = await connection.getTokenAccountBalance(
        indexerVault
      );
      console.log("🚀 ~ it ~ indexerVaultAfter:", indexerVaultAfter);

      assert.equal(
        payerVaultAfter.remainingAmount.toNumber(),
        payerVaultBefore.remainingAmount
          .sub(payerVaultBefore.remainingAmount)
          .toNumber()
      );
      assert.equal(
        indexerAccountAfter.balance.toNumber(),
        indexerAccountBefore.balance
          .add(payerVaultBefore.remainingAmount)
          .toNumber()
      );
      assert.equal(
        parseInt(indexerVaultAfter.value.amount),
        parseInt(indexerVaultBefore.value.amount) +
          payerVaultBefore.remainingAmount.toNumber()
      );
    });
  });

  describe("Charge fee", () => {
    it("Success charge fee", async () => {
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
      const systemAuthorityBefore = await program.account.systemAuthority.fetch(
        systemAuthority
      );
      const systemVaultBefore = await connection.getTokenAccountBalance(
        systemVault
      );

      const userVault = PublicKey.findProgramAddressSync(
        seeds.userVault(creatorIndexerKeypair.publicKey),
        program.programId
      )[0];
      const userVaultAta = getAssociatedTokenAddressSync(
        usdcMint,
        userVault,
        true,
        TOKEN_PROGRAM_ID
      );
      const userVaultBefore = await program.account.userVault.fetch(userVault);

      const tx = new Transaction();

      tx.add(
        await chargeFeeIx(provider.connection, {
          amount: userVaultBefore.remainingAmount,
          mint: usdcMint,
          operator: operatorKeypair.publicKey,
          systemAuthority,
          systemVault,
          tokenProgram: TOKEN_PROGRAM_ID,
          user: creatorIndexerKeypair.publicKey,
          userVault,
          userVaultAta,
        })
      );

      const blockhash = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash.blockhash;
      await sendAndConfirmTransaction(connection, tx, [operatorKeypair], {
        commitment: "finalized",
      });

      const userVaultAfter = await program.account.userVault.fetch(userVault);
      const systemAuthorityAfter = await program.account.systemAuthority.fetch(
        systemAuthority
      );
      const systemVaultAfter = await connection.getTokenAccountBalance(
        systemVault
      );

      assert.equal(
        userVaultAfter.remainingAmount.toNumber(),
        userVaultBefore.remainingAmount
          .sub(userVaultBefore.remainingAmount)
          .toNumber()
      );
      assert.equal(
        systemAuthorityAfter.balance.toNumber(),
        systemAuthorityBefore.balance
          .add(userVaultBefore.remainingAmount)
          .toNumber()
      );
      assert.equal(
        parseInt(systemVaultAfter.value.amount),
        parseInt(systemVaultBefore.value.amount) +
          userVaultBefore.remainingAmount.toNumber()
      );
    });
  });
});
