"use node";
import { action } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import Moralis from "moralis";

const MORALIS_API_KEY = process.env.MORALIS_API_KEY;

// Supported chains and their identifiers in Moralis
const SUPPORTED_CHAINS = {
  ethereum: "0x1",
  optimism: "0xa",
  base: "0x2105",
  arbitrum: "0xa4b1"
} as const;

// Initialize Moralis
if (!Moralis.Core.isStarted) {
  await Moralis.start({
    apiKey: MORALIS_API_KEY,
  });
}

export const updateEvmWalletHoldings = action({
  args: { 
    walletAddress: v.string()
  },
  handler: async (ctx, { walletAddress }) => {
    console.debug("Starting holdings update for wallet", { walletAddress });

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      console.error("Invalid address format:", walletAddress);
      throw new Error("Invalid Ethereum address");
    }

    try {
      const wallet = await ctx.runQuery(api.wallets.getWalletByAddress, { address: walletAddress });
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      const chainPromises = Object.entries(SUPPORTED_CHAINS).map(
        async ([chainName, chainId]) => {
          console.debug(`Processing chain: ${chainName}`, { chainId });

          const tokenBalances = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
            address: walletAddress,
            chain: chainId,
          });
          console.info(`Found ${tokenBalances.result.length} tokens on ${chainName}`);
          
          for (const token of tokenBalances.result) {
            if (!token.balance || !token.decimals) {
              console.debug(`Skipping token due to missing data:`, { symbol: token.symbol });
              continue;
            }
            
            // Skip spam tokens and ETHG
            if (token.possibleSpam || token.symbol?.includes("ETHG")) {
              console.debug(`Skipping spam/ETHG token:`, { symbol: token.symbol });
              continue;
            }
            
            const tokenBalance = Number(token.balance) / Math.pow(10, token.decimals);
            
            // Only upsert holdings with non-zero balance
            if (Math.abs(tokenBalance) > 0) {
              await ctx.runMutation(api.holdings.upsertHolding, {
                walletId: wallet._id,
                symbol: token.symbol || "",
                chain: chainName,
                quantity: tokenBalance,
              });

              // If we have a price quote, store it
              if (token.usdPrice) {
                await ctx.runMutation(api.quotes.upsertQuote, {
                  symbol: token.symbol || "",
                  price: Number(token.usdPrice),
                });
              }
            }
          }
        }
      );

      await Promise.all(chainPromises);
      console.debug("Completed holdings update");
      return true;

    } catch (error) {
      console.error("Error updating holdings:", error);
      throw error;
    }
  }
});

async function getBitcoinBalanceFromXpub(xpub: string) {
  console.debug("Fetching BTC balance for xpub:", xpub);
  const CRYPTO_APIS_KEY = "6195c728a6129bb5f4f1108b02a00eadf689765e";
  
  try {
    const response = await fetch(
      `https://rest.cryptoapis.io/hd-wallets/utxo/bitcoin/mainnet/${xpub}/details?context=yourExampleString&derivation=account`,
      {
        method: "GET",
        headers: {
          'X-API-Key': CRYPTO_APIS_KEY
        }
      }
    );

    if (!response.ok) {
      console.error("CryptoAPIs error status:", response.status);
      throw new Error(`CryptoAPIs error: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.debug("CryptoAPIs response:", data);

    const balanceInBTC = parseFloat(data.data.item.confirmedBalance);
    console.info("BTC balance calculated:", { balanceInBTC });

    return {
      confirmedBalance: balanceInBTC,
      totalReceived: parseFloat(data.data.item.totalReceived),
      totalSpent: parseFloat(data.data.item.totalSpent),
      unit: data.data.item.unit
    };
  } catch (error) {
    console.error("Error fetching BTC balance:", { error, xpub });
    throw error;
  }
}

// Action to get Bitcoin wallet balance
export const getBitcoinWalletBalance = action({
  args: {
    xpub: v.string()
  },
  handler: async (ctx, { xpub }) => {

    try {
      const balance = await getBitcoinBalanceFromXpub(xpub);
      return balance;
    } catch (error) {
      console.error("Error in getBitcoinWalletBalance action:", error);
      throw error;
    }
  }
});

/**
 * Universal action to update wallet holdings based on wallet type
 * This action determines the appropriate method to update holdings based on the wallet's chain type
 */
export const updateWalletHoldings = action({
  args: { 
    walletId: v.id("wallets")
  },
  handler: async (ctx, { walletId }) => {
    console.debug("Starting universal holdings update for wallet", { walletId });

    try {
      // Get the wallet details to determine its type
      const wallet = await ctx.runQuery(api.wallets.getWallet, { id: walletId });
      
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // Update the wallet based on its chain type
      if (wallet.chainType === "ethereum") {
        // For Ethereum wallets, call the EVM update function
        if (!/^0x[a-fA-F0-9]{40}$/.test(wallet.address)) {
          throw new Error("Invalid Ethereum address format");
        }
        
        // Call the action directly
        await ctx.runAction(api.holdingsNode.updateEvmWalletHoldings, { 
          walletAddress: wallet.address 
        });
        console.debug("Successfully updated EVM wallet holdings");
      } 
      else if (wallet.chainType === "bitcoin") {
        // For Bitcoin wallets, get the balance and update the holding
        const balance = await ctx.runAction(api.holdingsNode.getBitcoinWalletBalance, { 
          xpub: wallet.address 
        });
        
        // Update BTC holding for this wallet using a mutation
        await ctx.runMutation(api.holdings.upsertHolding, {
          walletId,
          symbol: "BTC",
          quantity: Number(balance.confirmedBalance),
          chain: "bitcoin"
        });
        
        console.debug("Successfully updated Bitcoin wallet holdings");
      } 
      else {
        throw new Error(`Unsupported wallet type: ${wallet.chainType}`);
      }

      // Update the wallet's lastUpdated timestamp
      await ctx.runMutation(api.wallets.updateWallet, {
        id: walletId,
        metadata: {
          lastUpdated: Date.now()
        }
      });

      return { success: true };
    } catch (error) {
      console.error("Error in updateWalletHoldings action:", error);
      throw error;
    }
  }
});
