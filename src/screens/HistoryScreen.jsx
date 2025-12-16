import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { fetchDCAHistory, getDCAStats } from '../helpers/NostrHelpers'
import './HistoryScreen.css'

function HistoryScreen() {
  const userPubkey = useSelector((state) => state.nostr.userPubkey)
  const localPurchases = useSelector((state) => state.dca.purchaseHistory)
  const [nostrPurchases, setNostrPurchases] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true)
      try {
        if (userPubkey) {
          const purchases = await fetchDCAHistory(userPubkey)
          setNostrPurchases(purchases)
          
          // Calculate stats
          const dcaStats = getDCAStats(purchases)
          setStats(dcaStats)
        }
      } catch (error) {
        console.error('Error loading history:', error)
      }
      setIsLoading(false)
    }

    loadHistory()
  }, [userPubkey])

  // Merge local and Nostr purchases
  const allPurchases = [...localPurchases, ...nostrPurchases].sort(
    (a, b) => (b.timestamp || b.createdAt * 1000) - (a.timestamp || a.createdAt * 1000)
  )

  if (isLoading) {
    return (
      <div className="history-screen">
        <div className="card">
          <h1>DCA History</h1>
          <div className="loading">Loading purchase history from Nostr...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="history-screen">
      <div className="card">
        <h1>DCA History</h1>

        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total BTC Accumulated</div>
              <div className="stat-value">{stats.totalBTC.toFixed(8)} BTC</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total USD Spent</div>
              <div className="stat-value">${stats.totalUSD.toFixed(2)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Average Price</div>
              <div className="stat-value">${stats.averagePrice.toFixed(2)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Purchase Count</div>
              <div className="stat-value">{stats.purchaseCount}</div>
            </div>
          </div>
        )}

        <div className="purchases-list">
          <h2>Purchase History</h2>
          {allPurchases.length === 0 ? (
            <div className="empty-state">
              <p>No purchases yet. Start your DCA journey!</p>
            </div>
          ) : (
            <div className="purchases">
              {allPurchases.map((purchase, index) => (
                <div key={purchase.id || index} className="purchase-item">
                  <div className="purchase-header">
                    <span className="purchase-currency">{purchase.currency}</span>
                    <span className="purchase-date">
                      {new Date(purchase.timestamp || purchase.createdAt * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="purchase-details">
                    <div className="detail">
                      <span className="label">Fiat Amount:</span>
                      <span className="value">
                        {purchase.fiatAmount.toFixed(2)} {purchase.currency}
                      </span>
                    </div>
                    <div className="detail">
                      <span className="label">BTC Amount:</span>
                      <span className="value btc">{purchase.btcAmount.toFixed(8)} BTC</span>
                    </div>
                    <div className="detail">
                      <span className="label">BTC Price:</span>
                      <span className="value">${purchase.btcPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  {purchase.id && (
                    <div className="nostr-badge">
                      <span>✓ Published to Nostr</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HistoryScreen

