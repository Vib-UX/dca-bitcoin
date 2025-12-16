import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import './WalletScreen.css'

function WalletScreen() {
  const navigate = useNavigate()
  const btcBalance = useSelector((state) => state.dca.btcBalance)
  const btcPrice = useSelector((state) => state.dca.btcPrice)
  const btcPrice24h = useSelector((state) => state.dca.btcPrice24h)
  const [priceChange24h, setPriceChange24h] = useState(0)
  const [showNotification, setShowNotification] = useState(false)

  useEffect(() => {
    // Calculate 24h price change
    const change = ((btcPrice - btcPrice24h) / btcPrice24h) * 100
    setPriceChange24h(change)
    
    // Show notification if price changes by 20% or more
    if (Math.abs(change) >= 20) {
      setShowNotification(true)
      
      // Hide notification after 8 seconds
      const timer = setTimeout(() => {
        setShowNotification(false)
      }, 8000)
      
      return () => clearTimeout(timer)
    }
  }, [btcPrice, btcPrice24h])

  const usdValue = btcBalance * btcPrice
  const isPositive = priceChange24h > 0

  return (
    <div className="wallet-screen">
      <div className="card">
        <h1>Wallet</h1>
        
        <div className="balance-section">
          <div className="balance-main">
            <div className="balance-label">BTC Balance</div>
            <div className="balance-amount btc">{btcBalance.toFixed(8)} BTC</div>
          </div>
          
          <div className="balance-usd">
            <div className="balance-label">USD Value</div>
            <div className="balance-amount usd">${usdValue.toFixed(2)}</div>
          </div>
        </div>

        <div className="price-info">
          <div className="price-item">
            <span>Current BTC Price:</span>
            <span className="price-value">${btcPrice.toFixed(2)}</span>
          </div>
          <div className="price-item">
            <span>24h Price:</span>
            <span className="price-value">${btcPrice24h.toFixed(2)}</span>
          </div>
          <div className="price-item">
            <span>24h Change:</span>
            <span className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
              {priceChange24h > 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
            </span>
          </div>
        </div>

        {showNotification && (
          <div className={`notification ${isPositive ? 'positive' : 'negative'}`}>
            <h2>🚀 BTC {isPositive ? 'up' : 'down'} {Math.abs(priceChange24h).toFixed(0)}%!</h2>
            <p>Stabilize profits?</p>
            <button 
              className="button button-secondary"
              onClick={() => {
                setShowNotification(false)
                navigate('/stable')
              }}
            >
              Go to Stable Channels
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default WalletScreen

