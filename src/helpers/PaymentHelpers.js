/**
 * Payment helpers using Smart Widget Handler (SWHandler)
 * Reference: YakiHonne habit tracker payment flow
 */

import SWHandler from 'smart-widget-handler';

/**
 * Request payment through SWHandler (native YakiHonne payment)
 * This matches the habit tracker's approach - fire and forget with event listener
 */
export const requestPaymentViaSWHandler = (paymentRequest, hostUrl) => {
  try {
    if (!SWHandler?.client?.requestPayment) {
      throw new Error('SWHandler payment request not available. Using fallback.');
    }

    console.log('Requesting payment via SWHandler:', paymentRequest);
    
    // Fire the payment request (don't await - it returns void)
    SWHandler.client.requestPayment(paymentRequest, hostUrl);
    
    console.log('Payment request sent via SWHandler');
    return true;
  } catch (error) {
    console.error('SWHandler payment request failed:', error);
    throw error;
  }
};

/**
 * Request DCA payment through parent app with event-based callback
 * This follows the habit tracker pattern
 */
export const requestDCAPayment = (
  invoice,
  metadata,
  hostUrl,
  onPaymentSuccess,
  onPaymentTimeout
) => {
  try {
    // Create payment request matching SWHandler format
    const paymentRequest = {
      address: invoice.invoice, // BOLT11 invoice
      amount: invoice.amountSats,
      nostrPubkey: metadata.userPubkey || null,
    };

    console.log('Creating payment request:', paymentRequest);

    // Send payment request via SWHandler (non-blocking)
    requestPaymentViaSWHandler(paymentRequest, hostUrl);

    // Track payment completion to prevent double processing
    let paymentCompleted = false;

    // Set up payment response listener
    const paymentResponseHandler = (event) => {
      console.log('Payment event received:', event.data);

      // Handle the actual response format from SWHandler
      if (event.data && event.data.kind === 'payment-response') {
        const paymentData = event.data.data;
        console.log('Payment response:', paymentData);

        if (paymentData.status === true && !paymentCompleted) {
          // Payment successful
          paymentCompleted = true;
          console.log('Payment successful, calling onPaymentSuccess');

          // Clear the timeout
          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          onPaymentSuccess({
            success: true,
            purpose: 'dca_payment',
            amount: invoice.amountSats,
            preImage: paymentData.preImage,
            paymentMethod: 'swhandler',
            invoice,
            metadata,
          });

          window.removeEventListener('message', paymentResponseHandler);
        } else if (paymentData.status === false && !paymentCompleted) {
          // Payment failed or declined
          console.log('❌ Payment failed with status:', paymentData.status);
          paymentCompleted = true;
          
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          const errorReason = paymentData.error || paymentData.reason || 'Payment declined or failed';
          console.log('Payment failure reason:', errorReason);
          
          if (onPaymentTimeout) {
            onPaymentTimeout({
              success: false,
              error: errorReason,
              paymentMethod: 'swhandler',
              declined: true,
            });
          }
          
          window.removeEventListener('message', paymentResponseHandler);
        }
      }
    };

    // Listen for payment response
    window.addEventListener('message', paymentResponseHandler);

    // Set timeout for payment (30 seconds)
    const timeoutId = setTimeout(() => {
      window.removeEventListener('message', paymentResponseHandler);

      // Only call timeout if payment hasn't been completed
      if (!paymentCompleted && onPaymentTimeout) {
        paymentCompleted = true;
        onPaymentTimeout({
          success: false,
          error: 'Payment timeout - showing QR code',
          paymentMethod: 'swhandler',
        });
      }
    }, 30000);

    return {
      success: true,
      purpose: 'payment_request_sent',
      paymentMethod: 'swhandler',
    };
  } catch (error) {
    console.error('DCA payment request failed:', error);
    throw error;
  }
};

/**
 * Request stable channel deposit payment through parent app
 */
export const requestStableChannelPayment = (
  invoice,
  btcAmount,
  hostUrl,
  onPaymentSuccess,
  onPaymentTimeout
) => {
  try {
    // Create payment request matching SWHandler format
    const paymentRequest = {
      address: invoice.invoice, // BOLT11 invoice
      amount: invoice.amountSats,
      nostrPubkey: null,
    };

    console.log('Creating stable channel payment request:', paymentRequest);

    // Send payment request via SWHandler (non-blocking)
    requestPaymentViaSWHandler(paymentRequest, hostUrl);

    // Track payment completion
    let paymentCompleted = false;

    // Set up payment response listener
    const paymentResponseHandler = (event) => {
      console.log('Stable channel payment event received:', event.data);

      if (event.data && event.data.kind === 'payment-response') {
        const paymentData = event.data.data;
        console.log('Stable channel payment response:', paymentData);

        if (paymentData.status === true && !paymentCompleted) {
          paymentCompleted = true;
          console.log('Stable channel payment successful');

          if (timeoutId) {
            clearTimeout(timeoutId);
          }

          onPaymentSuccess({
            success: true,
            purpose: 'stable_channel',
            btcAmount,
            amount: invoice.amountSats,
            preImage: paymentData.preImage,
            paymentMethod: 'swhandler',
          });

          window.removeEventListener('message', paymentResponseHandler);
        } else if (paymentData.status === false && !paymentCompleted) {
          paymentCompleted = true;
          
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          
          if (onPaymentTimeout) {
            onPaymentTimeout({
              success: false,
              error: 'Payment declined or failed',
              paymentMethod: 'swhandler',
            });
          }
          
          window.removeEventListener('message', paymentResponseHandler);
        }
      }
    };

    // Listen for payment response
    window.addEventListener('message', paymentResponseHandler);

    // Set timeout for payment (30 seconds)
    const timeoutId = setTimeout(() => {
      window.removeEventListener('message', paymentResponseHandler);

      if (!paymentCompleted && onPaymentTimeout) {
        paymentCompleted = true;
        onPaymentTimeout({
          success: false,
          error: 'Payment timeout - showing QR code',
          paymentMethod: 'swhandler',
        });
      }
    }, 30000);

    return {
      success: true,
      purpose: 'payment_request_sent',
      paymentMethod: 'swhandler',
    };
  } catch (error) {
    console.error('Stable channel payment request failed:', error);
    throw error;
  }
};

/**
 * Pay invoice directly (for fulfilling marketplace orders)
 */
export const payMarketplaceInvoice = async (invoice, orderData, hostUrl) => {
  try {
    const paymentRequest = {
      invoice: invoice,
      amount: Math.floor(orderData.btcAmount * 100000000),
      memo: `Pay DCA Order: ${orderData.fiatAmount} ${orderData.currency}`,
      metadata: {
        type: 'marketplace_payment',
        orderId: orderData.id,
        sellerPubkey: orderData.pubkey,
      },
    };

    const result = await requestPaymentViaSWHandler(paymentRequest, hostUrl);
    return result;
  } catch (error) {
    console.error('Marketplace payment failed:', error);
    throw error;
  }
};

/**
 * Check if SWHandler payment is available
 */
export const isSWHandlerPaymentAvailable = () => {
  return !!(SWHandler && SWHandler.client && SWHandler.client.requestPayment);
};

/**
 * Get payment capabilities
 */
export const getPaymentCapabilities = () => {
  return {
    swHandler: isSWHandlerPaymentAvailable(),
    webLN: !!(typeof window !== 'undefined' && window.webln),
    nwc: false, // Could be extended for NWC support
  };
};

/**
 * Get Lightning wallet details from SWHandler
 * This can get the user's Lightning address, balance, etc.
 */
export const getLightningDetailsFromSWHandler = async (hostUrl) => {
  try {
    if (!SWHandler?.client) {
      throw new Error('SWHandler not available');
    }

    // Request user data from parent app
    // The parent app (YakiHonne) can provide Lightning details
    console.log('📡 Requesting Lightning details from SWHandler...');
    
    // SWHandler doesn't have a direct method for this yet
    // But we can listen for user data events
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout getting Lightning details'));
      }, 5000);

      // Listen for user data events
      const listener = (event) => {
        if (event.data && event.data.kind === 'user-data') {
          clearTimeout(timeout);
          window.removeEventListener('message', listener);
          resolve(event.data.data);
        }
      };

      window.addEventListener('message', listener);
      
      // Request user data (if SWHandler supports it)
      if (SWHandler.client.requestUserData) {
        SWHandler.client.requestUserData(hostUrl);
      } else {
        clearTimeout(timeout);
        window.removeEventListener('message', listener);
        reject(new Error('SWHandler does not support user data requests'));
      }
    });
  } catch (error) {
    console.error('Failed to get Lightning details from SWHandler:', error);
    throw error;
  }
};

