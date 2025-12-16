/**
 * Lightning payment helpers for DCA Bitcoin
 * Supports NIP-57 (zaps), LNURL, and NWC
 */

/**
 * Fetch LNURL callback URL from lightning address
 */
export const getLNURLCallback = async (lightningAddress) => {
  try {
    const [name, domain] = lightningAddress.split("@");
    const url = `https://${domain}/.well-known/lnurlp/${name}`;

    const response = await fetch(url);
    const data = await response.json();

    return data;
  } catch (error) {
    console.error("Error fetching LNURL callback:", error);
    return null;
  }
};

/**
 * Request Lightning invoice
 */
export const requestInvoice = async (callback, amountSats, comment = "") => {
  try {
    const amountMsat = amountSats * 1000;
    const url = new URL(callback);
    url.searchParams.set("amount", amountMsat);
    if (comment) {
      url.searchParams.set("comment", comment);
    }

    const response = await fetch(url.toString());
    const data = await response.json();

    return data.pr; // Payment request (invoice)
  } catch (error) {
    console.error("Error requesting invoice:", error);
    return null;
  }
};

/**
 * Generate Lightning invoice for DCA purchase
 */
export const generateDCAInvoice = async (lightningAddress, amountSats, memo = "") => {
  const lnurlData = await getLNURLCallback(lightningAddress);
  if (!lnurlData || !lnurlData.callback) {
    throw new Error("Invalid lightning address");
  }

  const invoice = await requestInvoice(lnurlData.callback, amountSats, memo);
  if (!invoice) {
    throw new Error("Failed to generate invoice");
  }

  return invoice;
};

/**
 * Parse Lightning invoice (bolt11)
 */
export const parseInvoice = (bolt11) => {
  try {
    // Simple parsing - in production, use a proper bolt11 decoder
    return {
      paymentRequest: bolt11,
      valid: bolt11.toLowerCase().startsWith("ln"),
    };
  } catch (error) {
    console.error("Error parsing invoice:", error);
    return null;
  }
};

/**
 * Check if payment was successful (mock for now)
 */
export const checkPaymentStatus = async (paymentHash) => {
  // In production, this would check the actual payment status
  // For now, we'll simulate success after a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ paid: true, timestamp: Date.now() });
    }, 2000);
  });
};

/**
 * Format sats amount for display
 */
export const formatSats = (sats) => {
  return new Intl.NumberFormat().format(Math.floor(sats));
};

/**
 * Convert fiat to sats
 */
export const fiatToSats = (fiatAmount, btcPrice) => {
  const btcAmount = fiatAmount / btcPrice;
  return Math.floor(btcAmount * 100000000); // Convert BTC to sats
};

/**
 * Fetch wallet balance from Lightning address
 * Uses LNURL-pay callback to get wallet info
 * For now, returns a fixed balance of 4562 sats
 */
export const fetchWalletBalance = async (lightningAddress) => {
  try {
    if (!lightningAddress || !lightningAddress.includes('@')) {
      throw new Error('Invalid lightning address');
    }

    const [name, domain] = lightningAddress.split('@');
    const url = `https://${domain}/.well-known/lnurlp/${name}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch wallet info');
    }

    const data = await response.json();
    
    // Fixed balance of 4562 sats as requested
    // TODO: In production, integrate with actual wallet API or NWC for real balance
    const balance = 4562;
    
    return {
      lightningAddress,
      balance,
      maxSendable: data.maxSendable ? Math.floor(data.maxSendable / 1000) : null,
      minSendable: data.minSendable ? Math.floor(data.minSendable / 1000) : null,
      metadata: data.metadata,
      callback: data.callback,
    };
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    // Even on error, return the fixed balance
    return {
      lightningAddress,
      balance: 4562,
      maxSendable: null,
      minSendable: null,
      metadata: null,
      callback: null,
    };
  }
};

/**
 * Get wallet balance via NWC (Nostr Wallet Connect)
 * More reliable method for getting actual balance
 */
export const fetchNWCBalance = async (nwcUri) => {
  try {
    // Parse NWC URI
    // Format: nostr+walletconnect://pubkey?relay=wss://...&secret=xxx
    
    // This would require NWC implementation
    // For now, return mock data
    
    return {
      balance: Math.floor(Math.random() * 5000000) + 500000, // 500k-5.5M sats
      currency: 'sats',
      method: 'nwc',
    };
  } catch (error) {
    console.error('Error fetching NWC balance:', error);
    return null;
  }
};

