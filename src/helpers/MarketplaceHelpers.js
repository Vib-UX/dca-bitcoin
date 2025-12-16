/**
 * P2P Marketplace helpers for DCA orders
 */

import { NDKEvent } from '@nostr-dev-kit/ndk';
import { ndkInstance, relaysOnPlatform, ensureConnected } from './NostrInstance';
import { SimplePool } from 'nostr-tools';

// Custom event kind for P2P DCA marketplace orders
export const MARKETPLACE_ORDER_KIND = 31112;

/**
 * Publish DCA order to marketplace
 */
export const publishMarketplaceOrder = async (orderData) => {
  try {
    // Ensure NDK is connected
    const connected = await ensureConnected();
    if (!connected) {
      throw new Error('Failed to connect to Nostr relays');
    }

    const {
      fiatAmount,
      currency,
      btcAmount,
      btcPrice,
      silentPaymentAddress,
      invoice,
      paymentHash,
      expiry,
    } = orderData;

    console.log('📝 Creating marketplace order event...');
    const event = new NDKEvent(ndkInstance);
    event.kind = MARKETPLACE_ORDER_KIND;
    event.content = JSON.stringify({
      fiatAmount,
      currency,
      btcAmount,
      btcPrice,
      silentPaymentAddress,
      invoice,
      paymentHash,
      expiry,
      timestamp: Date.now(),
      status: 'open',
    });
    
    event.tags = [
      ['d', `order-${Date.now()}`],
      ['currency', currency],
      ['btc_amount', btcAmount.toString()],
      ['fiat_amount', fiatAmount.toString()],
      ['btc_price', btcPrice.toString()],
      ['invoice', invoice],
      ['payment_hash', paymentHash],
      ['expiry', expiry.toString()],
      ['status', 'open'],
      ['t', 'dca'],
      ['t', 'p2p'],
      ['app', 'dca-bitcoin'],
    ];

    console.log('📤 Publishing marketplace order to Nostr...');
    await event.publish();
    console.log('✅ Marketplace order published:', event.id);
    return event;
  } catch (error) {
    console.error('❌ Error publishing marketplace order:', error);
    console.error('Error details:', error.message, error.stack);
    throw error;
  }
};

/**
 * Fetch marketplace orders
 */
export const fetchMarketplaceOrders = async (filters = {}) => {
  const pool = new SimplePool();

  try {
    const query = {
      kinds: [MARKETPLACE_ORDER_KIND],
      limit: 50,
      ...filters,
    };

    const events = await pool.querySync(relaysOnPlatform, query);

    const orders = events
      .map((event) => {
        try {
          const content = JSON.parse(event.content);
          return {
            id: event.id,
            pubkey: event.pubkey,
            ...content,
            createdAt: event.created_at,
          };
        } catch (error) {
          console.error('Error parsing order event:', error);
          return null;
        }
      })
      .filter((order) => {
        // Filter out expired orders
        if (!order || !order.expiry) return false;
        return order.expiry * 1000 > Date.now();
      })
      .sort((a, b) => b.createdAt - a.createdAt);

    return orders;
  } catch (error) {
    console.error('Error fetching marketplace orders:', error);
    return [];
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (orderId, status, txData = {}) => {
  try {
    const event = new NDKEvent(ndkInstance);
    event.kind = 31113; // Order status update kind
    event.content = JSON.stringify({
      orderId,
      status,
      ...txData,
      timestamp: Date.now(),
    });
    
    event.tags = [
      ['e', orderId],
      ['status', status],
      ['app', 'dca-bitcoin'],
    ];

    await event.publish();
    console.log('Order status updated:', status);
    return event;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

/**
 * Get order statistics
 */
export const getMarketplaceStats = (orders) => {
  return {
    totalOrders: orders.length,
    totalBTC: orders.reduce((sum, order) => sum + parseFloat(order.btcAmount || 0), 0),
    totalUSD: orders.reduce((sum, order) => {
      if (order.currency === 'USD') {
        return sum + parseFloat(order.fiatAmount || 0);
      }
      return sum;
    }, 0),
    currencies: [...new Set(orders.map(o => o.currency))],
  };
};

/**
 * Filter orders by currency
 */
export const filterOrdersByCurrency = (orders, currency) => {
  return orders.filter(order => order.currency === currency);
};

/**
 * Filter orders by price range
 */
export const filterOrdersByPriceRange = (orders, minPrice, maxPrice) => {
  return orders.filter(order => {
    const price = parseFloat(order.btcPrice);
    return price >= minPrice && price <= maxPrice;
  });
};

