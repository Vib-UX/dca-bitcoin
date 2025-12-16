import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { fetchWalletBalance } from '../helpers/LightningHelpers';
import { formatSats } from '../helpers/InvoiceHelpers';
import './WalletBalance.css';

function WalletBalance() {
  const lightningAddress = useSelector((state) => state.nostr.lightningAddress);
  const userProfile = useSelector((state) => state.nostr.userProfile);
  const [walletInfo, setWalletInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch wallet balance when Lightning address is available
  useEffect(() => {
    if (lightningAddress) {
      loadWalletBalance();
      
      // Refresh every 30 seconds
      const interval = setInterval(loadWalletBalance, 30000);
      return () => clearInterval(interval);
    }
  }, [lightningAddress]);

  const loadWalletBalance = async () => {
    if (!lightningAddress) return;
    
    setIsLoading(true);
    try {
      const info = await fetchWalletBalance(lightningAddress);
      setWalletInfo(info);
    } catch (error) {
      console.error('Failed to load wallet balance:', error);
    }
    setIsLoading(false);
  };

  if (!lightningAddress) {
    return (
      <div className="wallet-balance-compact">
        <div className="no-wallet">
          <span className="wallet-icon">⚡</span>
          <span className="wallet-text">No Lightning wallet connected</span>
        </div>
      </div>
    );
  }

  if (!walletInfo && !isLoading) {
    return null;
  }

  return (
    <div className="wallet-balance-compact">
      <div 
        className="balance-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="balance-main">
          <span className="wallet-icon">⚡</span>
          <div className="balance-info">
            {isLoading ? (
              <span className="balance-loading">Loading...</span>
            ) : walletInfo ? (
              <>
                <span className="balance-amount">{formatSats(walletInfo.balance)}</span>
                <span className="balance-unit">sats</span>
              </>
            ) : null}
          </div>
        </div>
        <button className="expand-button">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {isExpanded && walletInfo && (
        <div className="balance-details">
          <div className="detail-row">
            <span className="detail-label">Lightning Address:</span>
            <span className="detail-value">{lightningAddress}</span>
          </div>
          
          {userProfile?.name && (
            <div className="detail-row">
              <span className="detail-label">Name:</span>
              <span className="detail-value">{userProfile.name}</span>
            </div>
          )}

          {walletInfo.maxSendable && (
            <div className="detail-row">
              <span className="detail-label">Max Receive:</span>
              <span className="detail-value">{formatSats(walletInfo.maxSendable)} sats</span>
            </div>
          )}

          {walletInfo.minSendable && (
            <div className="detail-row">
              <span className="detail-label">Min Receive:</span>
              <span className="detail-value">{formatSats(walletInfo.minSendable)} sats</span>
            </div>
          )}

          <button className="refresh-button" onClick={loadWalletBalance}>
            🔄 Refresh Balance
          </button>
        </div>
      )}
    </div>
  );
}

export default WalletBalance;

