import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addToBtcBalance, addPurchase } from "../store/dcaSlice";
import { publishDCAPurchase } from "../helpers/NostrHelpers";
import {
  requestDCAPayment,
  isSWHandlerPaymentAvailable,
} from "../helpers/PaymentHelpers";
import WalletBalance from "../components/WalletBalance";
import "./DCAScreen.css";

function DCAScreen() {
  const dispatch = useDispatch();
  const btcPrice24h = useSelector((state) => state.dca.btcPrice24h);
  const userPubkey = useSelector((state) => state.nostr.userPubkey);
  const userProfile = useSelector((state) => state.nostr.userProfile);
  const hostUrl =
    useSelector((state) => state.nostr.hostUrl) || window.location.origin;
  const [silentPaymentAddress, setSilentPaymentAddress] = useState("");
  const [fiatAmount, setFiatAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [btcAmount, setBtcAmount] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [conversionRate, setConversionRate] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("mock"); // 'mock' or 'invoice'
  const [paymentStatus, setPaymentStatus] = useState(null); // 'pending', 'processing', 'completed', 'failed'
  const [nativePaymentSupported, setNativePaymentSupported] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Check if native payment is supported
  useEffect(() => {
    setNativePaymentSupported(isSWHandlerPaymentAvailable());
  }, []);

  // Exchange rates based on actual BTC conversion rates:
  // 1 BTC = $86,087.97 USD
  // 1 BTC = 7,824,520.40 INR
  // 1 BTC = 1,437,050,334.00 IDR
  const idrRate = 16694.39; // 1 USD = 16,694.39 IDR (calculated from: 1,437,050,334 / 86,087.97)
  const inrRate = 90.88; // 1 USD = 90.88 INR (calculated from: 7,824,520.40 / 86,087.97)

  // Calculate conversion when amount or currency changes
  useEffect(() => {
    if (fiatAmount && parseFloat(fiatAmount) > 0 && btcPrice24h) {
      let usdAmount;

      if (currency === "USD") {
        usdAmount = parseFloat(fiatAmount);
      } else if (currency === "IDR") {
        usdAmount = parseFloat(fiatAmount) / idrRate;
      } else if (currency === "INR") {
        usdAmount = parseFloat(fiatAmount) / inrRate;
      }

      // Use 24-hour price for conversion
      const btc = usdAmount / btcPrice24h;
      setBtcAmount(btc);
      setConversionRate(btcPrice24h);
    } else {
      setBtcAmount(null);
      setConversionRate(null);
    }
  }, [fiatAmount, currency, btcPrice24h]);

  const handleFiatPayment = async () => {
    if (!silentPaymentAddress || !fiatAmount) {
      alert("Please enter both Silent Payment address and fiat amount");
      return;
    }

    if (!btcAmount || btcAmount <= 0) {
      alert("Invalid conversion amount");
      return;
    }

    console.log("💳 Starting payment process...", {
      paymentMethod,
      fiatAmount,
      currency,
      btcAmount,
      conversionRate,
      silentPaymentAddress,
    });

    setIsProcessing(true);
    setPaymentStatus(null);

    // If payment method is invoice, pay directly via SWHandler to Lightning address
    if (paymentMethod === "invoice") {
      try {
        const lightningAddress = "predator@wallet.yakihonne.com";
        const amountSats = Math.floor(
          (parseFloat(fiatAmount) / conversionRate) * 100000000
        );

        console.log("💳 Requesting payment via SWHandler:", {
          lightningAddress,
          amountSats,
          fiatAmount: parseFloat(fiatAmount),
          currency,
        });

        // Check if SWHandler is available
        if (!nativePaymentSupported) {
          throw new Error(
            "SWHandler not available. Please open in YakiHonne app."
          );
        }

        setPaymentStatus("processing");

        // Request payment directly to Lightning address
        requestDCAPayment(
          {
            invoice: lightningAddress, // Use Lightning address directly
            amountSats,
          },
          {
            fiatAmount: parseFloat(fiatAmount),
            currency,
            btcAmount,
            btcPrice: conversionRate,
            silentPaymentAddress,
            userPubkey,
          },
          hostUrl,
          // On payment success callback
          async (paymentResult) => {
            console.log("✅ Payment successful:", paymentResult);
            setPaymentStatus("completed");

            // Add to balance
            dispatch(addToBtcBalance(btcAmount));

            // Create purchase record
            const purchase = {
              fiatAmount: parseFloat(fiatAmount),
              currency,
              btcAmount,
              btcPrice: conversionRate,
              silentPaymentAddress,
              timestamp: Date.now(),
              paymentMethod: "lightning",
              lightningAddress,
            };

            // Add to local store
            dispatch(addPurchase(purchase));

            // Try to publish to Nostr (non-blocking)
            try {
              await publishDCAPurchase(purchase);
              console.log("✅ DCA purchase published to Nostr");
            } catch (error) {
              console.warn("⚠️ Could not publish to Nostr:", error.message);
            }

            // Show success
            setShowSuccess(true);
            setIsProcessing(false);

            setTimeout(() => {
              setShowSuccess(false);
              setFiatAmount("");
              setBtcAmount(null);
              setPaymentStatus(null);
            }, 3000);
          },
          // On payment timeout/failure callback
          (result) => {
            if (result?.declined) {
              console.log("❌ Payment declined by user");
              setErrorMessage("Payment was declined. Please try again.");
            } else {
              console.log("❌ Payment failed or timed out");
              setErrorMessage(
                result?.error || "Payment failed. Please try again."
              );
            }
            setPaymentStatus("failed");
            setIsProcessing(false);

            // Auto-clear error after 5 seconds
            setTimeout(() => setErrorMessage(null), 5000);
          }
        );
      } catch (error) {
        console.error("❌ Error processing payment:", error);
        console.error("Error stack:", error.stack);
        const errorMsg = `Failed to process payment: ${
          error.message || "Unknown error"
        }`;
        setErrorMessage(errorMsg);
        setPaymentStatus("failed");
        setIsProcessing(false);

        // Auto-clear error after 5 seconds
        setTimeout(() => setErrorMessage(null), 5000);
      }
      return;
    }

    // Conversion already calculated in useEffect using 24h price
    // Simulate mock payment processing
    setTimeout(async () => {
      // Add to balance
      dispatch(addToBtcBalance(btcAmount));

      // Create purchase record
      const purchase = {
        fiatAmount: parseFloat(fiatAmount),
        currency,
        btcAmount,
        btcPrice: conversionRate,
        silentPaymentAddress,
        timestamp: Date.now(),
      };

      // Add to local store
      dispatch(addPurchase(purchase));

      // Publish to Nostr
      setIsPublishing(true);
      try {
        await publishDCAPurchase(purchase);
        console.log("DCA purchase published to Nostr");
      } catch (error) {
        console.error("Failed to publish to Nostr:", error);
      }
      setIsPublishing(false);

      setIsProcessing(false);
      setShowSuccess(true);

      // Reset after showing success
      setTimeout(() => {
        setShowSuccess(false);
        setFiatAmount("");
        setBtcAmount(null);
      }, 3000);
    }, 2000);
  };

  return (
    <div className="dca-screen">
      <div className="card">
        <div className="header-with-profile">
          <h1>DCA Screen</h1>
          {userProfile && (
            <div className="user-badge">
              {userProfile.picture && (
                <img
                  src={userProfile.picture}
                  alt="Profile"
                  className="profile-pic"
                />
              )}
              <span className="username">
                {userProfile.name || userProfile.display_name || "Anon"}
              </span>
            </div>
          )}
        </div>

        <WalletBalance />

        <div className="form-group">
          <label htmlFor="silent-address">Silent Payment Address</label>
          <input
            id="silent-address"
            type="text"
            value={silentPaymentAddress}
            onChange={(e) => setSilentPaymentAddress(e.target.value)}
            placeholder="sp1..."
            className="input"
          />
          <small>Enter your Silent Payment receiving address</small>
        </div>

        <div className="form-group">
          <label htmlFor="payment-method">Payment Method</label>
          <select
            id="payment-method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="input"
          >
            <option value="mock">Mock Payment (Instant)</option>
            <option value="invoice">Lightning Invoice (P2P)</option>
          </select>
          <small>
            {paymentMethod === "mock"
              ? "Instant mock payment for testing"
              : nativePaymentSupported
              ? "Generate invoice & pay via YakiHonne wallet"
              : "Generate Lightning invoice for P2P marketplace"}
          </small>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="currency">Currency</label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="input"
            >
              <option value="USD">USD (US Dollar)</option>
              <option value="IDR">IDR (Indonesian Rupiah)</option>
              <option value="INR">INR (Indian Rupee)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="fiat-amount">Fiat Amount</label>
            <input
              id="fiat-amount"
              type="number"
              value={fiatAmount}
              onChange={(e) => setFiatAmount(e.target.value)}
              placeholder="1000000"
              className="input"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        {btcAmount && conversionRate && (
          <div className="conversion">
            <p>
              <strong>
                {fiatAmount} {currency}
              </strong>{" "}
              = <strong>{btcAmount.toFixed(8)} BTC</strong>
            </p>
            <p className="conversion-sats">
              ={" "}
              <strong>
                {Math.floor(btcAmount * 100000000).toLocaleString()} sats
              </strong>
            </p>
            <p className="conversion-rate">
              Using 24h BTC price: <strong>${conversionRate.toFixed(2)}</strong>
            </p>
          </div>
        )}

        <button
          onClick={handleFiatPayment}
          disabled={isProcessing || !silentPaymentAddress || !fiatAmount}
          className="button button-primary"
        >
          {isProcessing
            ? "Processing..."
            : paymentMethod === "invoice"
            ? "Pay via Lightning"
            : "Process Payment"}
        </button>

        {errorMessage && (
          <div className="error-message">
            <h2>❌ Error</h2>
            <p>{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="button button-secondary"
            >
              Dismiss
            </button>
          </div>
        )}

        {paymentStatus === "processing" && !errorMessage && (
          <div className="processing-message">
            <h2>Processing Payment...</h2>
            <p>Please approve the payment in YakiHonne wallet</p>
            <small>Paying to: predator@wallet.yakihonne.com</small>
          </div>
        )}

        {showSuccess && (
          <div className="success-message">
            <h2>✓ BTC Received!</h2>
            <p>
              Your payment of {btcAmount.toFixed(8)} BTC has been processed via
              Silent Payment address: {silentPaymentAddress.substring(0, 20)}...
            </p>
            {isPublishing && (
              <p className="publishing">Publishing to Nostr...</p>
            )}
            {!isPublishing && <p className="published">✓ Published to Nostr</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default DCAScreen;
