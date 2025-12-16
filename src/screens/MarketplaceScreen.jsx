import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { fetchMarketplaceOrders, getMarketplaceStats } from '../helpers/MarketplaceHelpers'
import { formatSats, formatBTC } from '../helpers/InvoiceHelpers'
import InvoiceModal from '../components/InvoiceModal'
import './MarketplaceScreen.css'

function MarketplaceScreen() {
  const userPubkey = useSelector((state) => state.nostr.userPubkey)
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [filter, setFilter] = useState('all') // 'all', 'USD', 'IDR', 'INR'

  useEffect(() => {
    loadOrders()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadOrders, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadOrders = async () => {
    setIsLoading(true)
    try {
      const fetchedOrders = await fetchMarketplaceOrders()
      setOrders(fetchedOrders)
      
      const orderStats = getMarketplaceStats(fetchedOrders)
      setStats(orderStats)
    } catch (error) {
      console.error('Error loading orders:', error)
    }
    setIsLoading(false)
  }

  const handlePayOrder = (order) => {
    setSelectedOrder(order)
    setShowInvoiceModal(true)
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.currency === filter)

  if (isLoading) {
    return (
      <div className="marketplace-screen">
        <div className="card">
          <h1>P2P Marketplace</h1>
          <div className="loading">Loading orders...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="marketplace-screen">
      <div className="card">
        <h1>P2P DCA Marketplace</h1>
        <p className="subtitle">Lightning invoices for instant Bitcoin purchases</p>

        {stats && (
          <div className="stats-row">
            <div className="stat-item">
              <span className="stat-label">Active Orders</span>
              <span className="stat-value">{stats.totalOrders}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total BTC</span>
              <span className="stat-value">{formatBTC(stats.totalBTC)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total USD</span>
              <span className="stat-value">${stats.totalUSD.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="filter-bar">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'USD' ? 'active' : ''}`}
            onClick={() => setFilter('USD')}
          >
            USD
          </button>
          <button
            className={`filter-btn ${filter === 'IDR' ? 'active' : ''}`}
            onClick={() => setFilter('IDR')}
          >
            IDR
          </button>
          <button
            className={`filter-btn ${filter === 'INR' ? 'active' : ''}`}
            onClick={() => setFilter('INR')}
          >
            INR
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <p>No active orders in marketplace</p>
            <p className="hint">Create a DCA order with Lightning invoice to list here</p>
          </div>
        ) : (
          <div className="orders-list">
            {filteredOrders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <span className="currency-badge">{order.currency}</span>
                  <span className="time">
                    {new Date(order.createdAt * 1000).toLocaleTimeString()}
                  </span>
                </div>

                <div className="order-details">
                  <div className="detail-row">
                    <span className="label">Amount:</span>
                    <span className="value">
                      {order.fiatAmount.toFixed(2)} {order.currency}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">BTC:</span>
                    <span className="value btc">{formatBTC(order.btcAmount)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Price:</span>
                    <span className="value">${order.btcPrice.toFixed(2)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Sats:</span>
                    <span className="value">{formatSats(order.btcAmount * 100000000)}</span>
                  </div>
                </div>

                {order.pubkey === userPubkey ? (
                  <div className="own-order-badge">Your Order</div>
                ) : (
                  <button
                    className="pay-button"
                    onClick={() => handlePayOrder(order)}
                  >
                    ⚡ Pay Invoice
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {showInvoiceModal && selectedOrder && (
          <InvoiceModal
            invoice={{
              invoice: selectedOrder.invoice,
              amountSats: Math.floor(selectedOrder.btcAmount * 100000000),
              memo: `DCA Order: ${selectedOrder.fiatAmount} ${selectedOrder.currency}`,
              expiry: selectedOrder.expiry,
              paymentHash: selectedOrder.paymentHash,
            }}
            onClose={() => {
              setShowInvoiceModal(false)
              setSelectedOrder(null)
            }}
            onPaymentConfirmed={() => {
              setShowInvoiceModal(false)
              setSelectedOrder(null)
              // Refresh orders
              loadOrders()
            }}
          />
        )}
      </div>
    </div>
  )
}

export default MarketplaceScreen

