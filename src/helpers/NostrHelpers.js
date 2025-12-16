import { SimplePool, nip19 } from "nostr-tools";
import { ndkInstance, relaysOnPlatform, ensureConnected } from "./NostrInstance";
import { NDKEvent } from "@nostr-dev-kit/ndk";

// DCA Bitcoin Event Kinds
// Using custom event kinds in the 30000-40000 range for parameterized replaceable events
export const DCA_PURCHASE_KIND = 31111; // Custom kind for DCA purchases

/**
 * Get user profile from Nostr
 */
export const getUserProfile = async (pubkey) => {
  const pool = new SimplePool();

  try {
    const event = await pool.get(relaysOnPlatform, {
      kinds: [0],
      authors: [pubkey],
      limit: 1,
    });

    if (event) {
      const profile = JSON.parse(event.content);
      return profile;
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
  }

  return null;
};

/**
 * Get lightning address from user profile
 */
export const getLightningAddress = async (pubkey) => {
  const profile = await getUserProfile(pubkey);
  if (profile) {
    return profile.lud16 || profile.lud06 || null;
  }
  return null;
};

/**
 * Publish DCA purchase to Nostr
 */
export const publishDCAPurchase = async (purchaseData) => {
  try {
    // Ensure NDK is connected
    const connected = await ensureConnected();
    if (!connected) {
      throw new Error('Failed to connect to Nostr relays');
    }

    const { fiatAmount, currency, btcAmount, btcPrice, silentPaymentAddress } = purchaseData;

    console.log('📝 Creating DCA purchase event...');
    const event = new NDKEvent(ndkInstance);
    event.kind = DCA_PURCHASE_KIND;
    event.content = JSON.stringify({
      fiatAmount,
      currency,
      btcAmount,
      btcPrice,
      timestamp: Date.now(),
      silentPaymentAddress,
    });
    event.tags = [
      ["d", `dca-${Date.now()}`], // 'd' tag for replaceable events
      ["currency", currency],
      ["btc_amount", btcAmount.toString()],
      ["btc_price", btcPrice.toString()],
      ["app", "dca-bitcoin"],
    ];

    console.log('📤 Publishing DCA purchase to Nostr...');
    await event.publish();
    console.log("✅ DCA purchase published to Nostr:", event.id);
    return event;
  } catch (error) {
    console.error("❌ Error publishing DCA purchase:", error);
    console.error('Error details:', error.message, error.stack);
    throw error;
  }
};

/**
 * Fetch user's DCA purchase history from Nostr
 */
export const fetchDCAHistory = async (pubkey) => {
  const pool = new SimplePool();

  try {
    const events = await pool.querySync(relaysOnPlatform, {
      kinds: [DCA_PURCHASE_KIND],
      authors: [pubkey],
      limit: 100,
    });

    const purchases = events
      .map((event) => {
        try {
          const content = JSON.parse(event.content);
          return {
            id: event.id,
            ...content,
            createdAt: event.created_at,
          };
        } catch (error) {
          console.error("Error parsing purchase event:", error);
          return null;
        }
      })
      .filter((p) => p !== null)
      .sort((a, b) => b.createdAt - a.createdAt);

    return purchases;
  } catch (error) {
    console.error("Error fetching DCA history:", error);
    return [];
  }
};

/**
 * Calculate total BTC accumulated from purchase history
 */
export const calculateTotalBTC = (purchases) => {
  return purchases.reduce((total, purchase) => {
    return total + parseFloat(purchase.btcAmount || 0);
  }, 0);
};

/**
 * Calculate total fiat spent
 */
export const calculateTotalFiat = (purchases, currency = "USD") => {
  return purchases
    .filter((p) => p.currency === currency)
    .reduce((total, purchase) => {
      return total + parseFloat(purchase.fiatAmount || 0);
    }, 0);
};

/**
 * Get DCA statistics
 */
export const getDCAStats = (purchases) => {
  if (purchases.length === 0) {
    return {
      totalBTC: 0,
      totalUSD: 0,
      averagePrice: 0,
      purchaseCount: 0,
      firstPurchase: null,
      lastPurchase: null,
    };
  }

  const totalBTC = calculateTotalBTC(purchases);
  const totalUSD = calculateTotalFiat(purchases, "USD");
  const averagePrice = totalBTC > 0 ? totalUSD / totalBTC : 0;

  return {
    totalBTC,
    totalUSD,
    averagePrice,
    purchaseCount: purchases.length,
    firstPurchase: purchases[purchases.length - 1]?.createdAt || null,
    lastPurchase: purchases[0]?.createdAt || null,
  };
};

/**
 * Decode npub/nsec
 */
export const decodeNostrAddress = (address) => {
  try {
    if (address.startsWith("npub")) {
      const decoded = nip19.decode(address);
      return decoded.data;
    }
    return address;
  } catch (error) {
    console.error("Error decoding Nostr address:", error);
    return null;
  }
};

