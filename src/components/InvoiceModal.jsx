import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { formatSats, formatBTC } from '../helpers/InvoiceHelpers';
import './InvoiceModal.css';

function InvoiceModal({ invoice, onClose, onPaymentConfirmed }) {
  const [copied, setCopied] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  useEffect(() => {
    // Auto-check payment status every 5 seconds
    const interval = setInterval(() => {
      checkPayment();
    }, 5000);

    return () => clearInterval(interval);
  }, [invoice]);

  const checkPayment = async () => {
    if (!invoice || checkingPayment) return;
    
    setCheckingPayment(true);
    // Simulate payment check
    setTimeout(() => {
      // In production, check actual payment status
      setCheckingPayment(false);
    }, 1000);
  };

  const copyInvoice = () => {
    navigator.clipboard.writeText(invoice.invoice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatExpiry = (timestamp) => {
    const expiryDate = new Date(timestamp * 1000);
    const now = new Date();
    const diff = expiryDate - now;
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minutes`;
  };

  if (!invoice) return null;

  return (
    <div className="invoice-modal-overlay" onClick={onClose}>
      <div className="invoice-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <h2>Lightning Invoice</h2>
        
        <div className="invoice-details">
          <div className="detail-row">
            <span className="label">Amount:</span>
            <span className="value">
              {formatSats(invoice.amountSats)} sats
              <span className="btc-amount">({formatBTC(invoice.amountSats / 100000000)} BTC)</span>
            </span>
          </div>
          
          {invoice.memo && (
            <div className="detail-row">
              <span className="label">Memo:</span>
              <span className="value">{invoice.memo}</span>
            </div>
          )}
          
          <div className="detail-row">
            <span className="label">Expires in:</span>
            <span className="value expires">{formatExpiry(invoice.expiry)}</span>
          </div>
        </div>

        <div className="qr-section">
          <div className="qr-container">
            <QRCode 
              value={invoice.invoice} 
              size={256}
              level="M"
            />
          </div>
          <p className="qr-hint">Scan with Lightning wallet</p>
        </div>

        <div className="invoice-string">
          <div className="invoice-text">{invoice.invoice}</div>
          <button 
            className="copy-button" 
            onClick={copyInvoice}
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>

        <div className="action-buttons">
          <button 
            className="button button-secondary"
            onClick={checkPayment}
            disabled={checkingPayment}
          >
            {checkingPayment ? 'Checking...' : 'Check Payment'}
          </button>
          
          <button 
            className="button button-primary"
            onClick={() => {
              // Simulate payment confirmation
              if (onPaymentConfirmed) {
                onPaymentConfirmed(invoice);
              }
            }}
          >
            I've Paid
          </button>
        </div>

        <div className="payment-info">
          <p className="info-text">
            Payment will be automatically detected when invoice is paid.
            The BTC will be sent to your Silent Payment address.
          </p>
        </div>
      </div>
    </div>
  );
}

export default InvoiceModal;

