"use node";
import { action } from "./_generated/server";
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

// Native token price addresses for each chain
const NATIVE_TOKEN_ADDRESSES = {
  "0x1": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH on Ethereum
  "0xa": "0x4200000000000000000000000000000000000006", // WETH on Optimism
  "0x2105": "0x4200000000000000000000000000000006", // WETH on Base
  "0xa4b1": "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", // WETH on Arbitrum
};

// Initialize Moralis
if (!Moralis.Core.isStarted) {
  await Moralis.start({
    apiKey: MORALIS_API_KEY,
  });
}

// Helper function to check if a token is an Aave wrapped ETH token
const isAaveWrappedEth = (token: any): boolean => {
  return token.symbol?.includes("aEthWETH") || 
         token.symbol?.includes("aBasWETH") ||  // Add Base Aave WETH
         (token.symbol?.includes("aEth") && token.symbol?.includes("ETH"));
};

// Helper function to check if a token is a variable debt token
const isVariableDebtToken = (token: any): boolean => {
  return token.symbol?.includes("variableDebt");
};

export const getWalletBalance = action({
  args: { 
    walletAddress: v.string(),
    ethPrice: v.optional(v.number())
  },
  handler: async (ctx, { walletAddress, ethPrice }) => {
    console.debug("Starting wallet balance calculation", { walletAddress, providedEthPrice: ethPrice });

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      console.error("Invalid address format:", walletAddress);
      throw new Error("Invalid Ethereum address");
    }

    try {
      const chainPromises = Object.entries(SUPPORTED_CHAINS).map(
        async ([chainName, chainId]) => {
          console.debug(`Processing chain: ${chainName}`, { chainId });

          const nativeBalance = await Moralis.EvmApi.balance.getNativeBalance({
            address: walletAddress,
            chain: chainId,
          });
          console.debug(`Native balance for ${chainName}:`, nativeBalance.result.balance.toString());

          const tokenBalances = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
            address: walletAddress,
            chain: chainId,
          });
          console.info(`Found ${tokenBalances.result.length} tokens on ${chainName}`);

          let nativeUsdValue = "0.00";
          let nativeEthPrice = ethPrice || 0;
          
          try {
            if (!ethPrice && NATIVE_TOKEN_ADDRESSES[chainId]) {
              console.debug(`Fetching native price for ${chainName}`);
              const nativePrice = await Moralis.EvmApi.token.getTokenPrice({
                chain: chainId,
                address: NATIVE_TOKEN_ADDRESSES[chainId]
              });
              nativeEthPrice = Number(nativePrice.result.usdPrice);
              console.info(`Native price for ${chainName}:`, nativeEthPrice);
            } else {
              console.debug(`Using provided ETH price for ${chainName}:`, nativeEthPrice);
            }
          } catch (priceError) {
            console.error(`Failed to fetch native token price for chain ${chainName}:`, priceError);
          }

          if (nativeEthPrice > 0) {
            nativeUsdValue = (
              Number(nativeBalance.result.balance) / 1e18 * nativeEthPrice
            ).toFixed(2);
            console.info(`Native USD value for ${chainName}:`, nativeUsdValue);
          }

          // let totalUsdValue = Number(nativeUsdValue);
          let totalUsdValue = 0;
          console.debug(`Starting token processing for ${chainName}, base value:`, totalUsdValue);
          
          tokenBalances.result.forEach(token => {
            if (!token.balance || !token.decimals) {
              console.debug(`Skipping token due to missing data:`, { symbol: token.symbol, balance: token.balance, decimals: token.decimals });
              return;
            }
            
            // Skip spam tokens and ETHG
            if (token.possible_spam || token.symbol?.includes("ETHG")) {
              console.debug(`Skipping spam/ETHG token:`, { symbol: token.symbol, isSpam: token.possible_spam });
              return;
            }
            
            const tokenBalance = Number(token.balance) / Math.pow(10, token.decimals);
            console.debug(`Processing token:`, { 
              symbol: token.symbol, 
              balance: tokenBalance,
              isAave: isAaveWrappedEth(token),
              isDebt: isVariableDebtToken(token)
            });

            if (isAaveWrappedEth(token)) {
              const tokenValue = tokenBalance * nativeEthPrice;
              token.usd_price = nativeEthPrice;
              token.usd_value = tokenValue;
              totalUsdValue += tokenValue;
              console.info(`Added Aave ETH value:`, { symbol: token.symbol, value: tokenValue, newTotal: totalUsdValue });
            } else if (isVariableDebtToken(token)) {
              const debtValue = tokenBalance;
              token.usd_price = 1;
              token.usd_value = debtValue;
              totalUsdValue -= debtValue;
              console.info(`Subtracted debt value:`, { symbol: token.symbol, value: debtValue, newTotal: totalUsdValue });
            } else if (token.usdPrice) {
              const tokenValue = tokenBalance * Number(token.usdPrice);
              totalUsdValue += tokenValue;
              console.debug(`Added token value:`, { symbol: token.symbol, value: tokenValue, newTotal: totalUsdValue });
            }
          });

          console.info(`Chain ${chainName} total value:`, totalUsdValue);
          return {
            chainName,
            nativeBalance: {
              balance: nativeBalance.result.balance.toString(),
              token: chainName === 'ethereum' ? 'ETH' :
                     chainName === 'optimism' ? 'OP-ETH' :
                     chainName === 'base' ? 'BASE-ETH' : 'ARB-ETH',
              usdValue: nativeUsdValue,
              usdPrice: nativeEthPrice
            },
            tokens: tokenBalances.result,
            totalUsdValue: totalUsdValue
          };
        }
      );

      const results = await Promise.all(chainPromises);
      console.debug("All chain results:", results.map(r => ({ chain: r.chainName, value: r.totalUsdValue })));

      const totalUsdValue = results.reduce(
        (sum, result) => sum + result.totalUsdValue,
        0
      ).toFixed(2);
      console.log("Final wallet total:", totalUsdValue);

      // Create response...
      console.debug("Formatting final response");
      const response = {
        totalUsdValue,
        balances: results.reduce((acc, result) => {
          acc[result.chainName] = {
            nativeBalance: {
              balance: result.nativeBalance.balance,
              token: result.nativeBalance.token,
              usdValue: result.nativeBalance.usdValue
            },
            tokens: result.tokens.map(token => {
              // Ensure all values are primitive types (string, number, boolean)
              return {
                token_address: token.token_address?.toString() || "",
                name: token.name?.toString() || "",
                symbol: token.symbol?.toString() || "",
                logo: token.logo?.toString() || null,
                thumbnail: token.thumbnail?.toString() || null,
                decimals: Number(token.decimals) || 0,
                balance: token.balance?.toString() || "0",
                possible_spam: Boolean(token.possible_spam),
                verified_contract: Boolean(token.verified_contract),
                usd_price: Number(token.usd_price) || 0,
                usd_price_24hr_percent_change: Number(token.usd_price_24hr_percent_change) || 0,
                usd_price_24hr_usd_change: Number(token.usd_price_24hr_usd_change) || 0,
                usd_value_24hr_usd_change: Number(token.usd_value_24hr_usd_change) || 0,
                usd_value: Number(token.usd_value) || 0,
                portfolio_percentage: Number(token.portfolio_percentage) || 0,
                balance_formatted: token.balance_formatted?.toString() || "0",
                native_token: Boolean(token.native_token),
                total_supply: token.total_supply?.toString() || null,
                total_supply_formatted: token.total_supply_formatted?.toString() || null,
                percentage_relative_to_total_supply: token.percentage_relative_to_total_supply !== null ? 
                  Number(token.percentage_relative_to_total_supply) : null
              };
            }),
            totalUsdValue: result.totalUsdValue.toFixed(2)
          };
          return acc;
        }, {})
      };

      return response;
    } catch (error) {
      console.error("Error fetching wallet balances:", error);
      throw error;
    }
  }
});

export const getWalletNetWorth = action({
  args: {
    walletAddress: v.string(),
  },
  handler: async (ctx, {
    walletAddress,
  }) => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      throw new Error("Invalid Ethereum address");
    }

    const netWorth = await Moralis.EvmApi.wallets.getWalletNetWorth({
      address: walletAddress,
    });

    return netWorth.raw;
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
