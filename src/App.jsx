import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Provider, useSelector, useDispatch } from 'react-redux'
import SWHandler from 'smart-widget-handler'
import { store } from './store/store'
import { setBtcPrice, setBtcPrice24h } from './store/dcaSlice'
import { setHostUrl } from './store/nostrSlice'
import DCAScreen from './screens/DCAScreen'
import WalletScreen from './screens/WalletScreen'
import StableScreen from './screens/StableScreen'
import HistoryScreen from './screens/HistoryScreen'
import MarketplaceScreen from './screens/MarketplaceScreen'
import NostrLogin from './components/NostrLogin'
import './App.css'

function AppContent() {
  const dispatch = useDispatch()
  const isConnected = useSelector((state) => state.nostr.isConnected)
  const isLoading = useSelector((state) => state.nostr.isLoading)
  const error = useSelector((state) => state.nostr.error)

  // Initialize SWHandler
  useEffect(() => {
    // Signal widget is ready
    if (SWHandler && SWHandler.client) {
      SWHandler.client.ready()
      console.log('SWHandler initialized')
    }

    // Listen for host data (including origin URL)
    const listener = SWHandler?.client?.listen((event) => {
      console.log('Event from host:', event)
      if (event.data && event.data.host_origin) {
        dispatch(setHostUrl(event.data.host_origin))
        console.log('Host URL set:', event.data.host_origin)
      }
    })

    return () => {
      if (listener && listener.close) {
        listener.close()
      }
    }
  }, [dispatch])

  const btcPrice = useSelector((state) => state.dca.btcPrice)
  const btcPrice24h = useSelector((state) => state.dca.btcPrice24h)

  // Simulate price changes and track 24-hour history
  useEffect(() => {
    // Initialize 24h price (set to 5% lower to simulate some movement)
    dispatch(setBtcPrice24h(86087.97 * 0.95))
    
    const interval = setInterval(() => {
      // Random price fluctuation between -2% and +2%
      const change = (Math.random() - 0.5) * 0.04
      dispatch(setBtcPrice(btcPrice * (1 + change)))
      
      // Update 24h price to simulate historical movement (slower changes)
      const historicalChange = (Math.random() - 0.5) * 0.02
      dispatch(setBtcPrice24h(btcPrice24h * (1 + historicalChange)))
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [dispatch, btcPrice, btcPrice24h])

  // Show Nostr login if not connected
  if (!isConnected && !isLoading) {
    return <NostrLogin />
  }

  // Show error if connection failed
  if (error) {
    return (
      <div className="error-container">
        <h2>Connection Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className="button button-primary">
          Retry
        </button>
      </div>
    )
  }

  return (
    <Router>
      <div className="app">
        <nav className="nav">
          <div className="nav-links">
            <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>DCA</NavLink>
            <NavLink to="/marketplace" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Market</NavLink>
            <NavLink to="/wallet" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Wallet</NavLink>
            <NavLink to="/stable" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>Stable</NavLink>
            <NavLink to="/history" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>History</NavLink>
          </div>
        </nav>
        <main className="main">
          <Routes>
            <Route path="/" element={<DCAScreen />} />
            <Route path="/marketplace" element={<MarketplaceScreen />} />
            <Route path="/wallet" element={<WalletScreen />} />
            <Route path="/stable" element={<StableScreen />} />
            <Route path="/history" element={<HistoryScreen />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}

export default App

