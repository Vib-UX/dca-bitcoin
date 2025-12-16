/**
 * Lightning Invoice generation and management helpers
 */

import { nanoid } from 'nanoid';

/**
 * Generate a valid-looking mock Lightning invoice (bolt11)
 * In production, this would call a real Lightning node/service
 */
export const generateLightningInvoice = async (amountSats, memo = '', metadata = {}) => {
  try {
    // Mock invoice generation
    // In production, use services like:
    // - LNbits API
    // - BTCPay Server
    // - Strike API
    // - Alby API
    // - LND/CLN node
    
    // Generate a payment hash (32 bytes hex = 64 characters)
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const paymentHash = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const timestamp = Math.floor(Date.now() / 1000);
    const expirySeconds = 3600; // 1 hour
    
    // Generate a valid-looking bolt11 invoice
    // Format: lnbc[amount][multiplier]1[data][checksum]
    // Using only lowercase letters and numbers (valid bech32 characters)
    const randomPart = Array.from(crypto.getRandomValues(new Uint8Array(50)))
      .map(b => 'qpzry9x8gf2tvdw0s3jn54khce6mua7l'[b % 32])
      .join('');
    
    const invoice = `lnbc${amountSats}n1p${randomPart}`;
    
    return {
      invoice,
      paymentHash,
      amountSats,
      amountMsat: amountSats * 1000,
      memo,
      timestamp,
      expiry: timestamp + expirySeconds,
      metadata,
      qrData: invoice,
    };
  } catch (error) {
    console.error('Error generating invoice:', error);
    throw error;
  }
};

/**
 * Check invoice payment status
 * In production, this would check with Lightning node/service
 */
export const checkInvoiceStatus = async (paymentHash) => {
  // Mock payment check
  // In production, query Lightning node for payment status
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate random payment status
      const isPaid = Math.random() > 0.5;
      resolve({
        paid: isPaid,
        settledAt: isPaid ? Date.now() : null,
        paymentHash,
      });
    }, 1000);
  });
};

/**
 * Decode Lightning invoice
 */
export const decodeInvoice = (bolt11) => {
  try {
    // Mock decoder - in production use bolt11 library
    // This is a simplified version
    const matches = bolt11.match(/lnbc(\d+)n1p(.+)/);
    if (!matches) {
      throw new Error('Invalid invoice format');
    }
    
    const amountSats = parseInt(matches[1]);
    const paymentHash = matches[2];
    
    return {
      amountSats,
      amountMsat: amountSats * 1000,
      paymentHash,
      invoice: bolt11,
      valid: true,
    };
  } catch (error) {
    console.error('Error decoding invoice:', error);
    return { valid: false, error: error.message };
  }
};

/**
 * Generate invoice for DCA order
 */
export const generateDCAOrderInvoice = async (fiatAmount, currency, btcPrice, silentPaymentAddress) => {
  const btcAmount = fiatAmount / btcPrice;
  const satAmount = Math.floor(btcAmount * 100000000);
  
  const memo = `DCA Order: ${fiatAmount} ${currency} → ${btcAmount.toFixed(8)} BTC`;
  
  const invoice = await generateLightningInvoice(satAmount, memo, {
    type: 'dca_order',
    fiatAmount,
    currency,
    btcAmount,
    btcPrice,
    silentPaymentAddress,
  });
  
  return invoice;
};

/**
 * Generate invoice for stable channel deposit
 */
export const generateStableChannelInvoice = async (btcAmount) => {
  const satAmount = Math.floor(btcAmount * 100000000);
  const memo = `Stable Channel Deposit: ${btcAmount.toFixed(8)} BTC`;
  
  const invoice = await generateLightningInvoice(satAmount, memo, {
    type: 'stable_channel',
    btcAmount,
  });
  
  return invoice;
};

/**
 * Format satoshis for display
 */
export const formatSats = (sats) => {
  return new Intl.NumberFormat().format(Math.floor(sats));
};

/**
 * Format BTC amount
 */
export const formatBTC = (btc) => {
  return btc.toFixed(8);
};

/**
 * Sats to BTC
 */
export const satsToBTC = (sats) => {
  return sats / 100000000;
};

/**
 * BTC to Sats
 */
export const btcToSats = (btc) => {
  return Math.floor(btc * 100000000);
};

