import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { depositToStableChannel } from '../store/dcaSlice'
import { generateStableChannelInvoice } from '../helpers/InvoiceHelpers'
import { requestStableChannelPayment, isSWHandlerPaymentAvailable } from '../helpers/PaymentHelpers'
import InvoiceModal from '../components/InvoiceModal'
import './StableScreen.css'

function StableScreen() {
  const dispatch = useDispatch()
  const btcBalance = useSelector((state) => state.dca.btcBalance)
  const channelBalanceFromStore = useSelector((state) => state.dca.stableChannelBalance)
  const hostUrl = useSelector((state) => state.nostr.hostUrl) || window.location.origin
  const [depositPercent, setDepositPercent] = useState(50)
  const [channelBalance, setChannelBalance] = useState(channelBalanceFromStore)
  const [isDepositing, setIsDepositing] = useState(false)
  const [isRebalancing, setIsRebalancing] = useState(false)
  const [rebalanceLog, setRebalanceLog] = useState([])
  const [depositMethod, setDepositMethod] = useState('instant') // 'instant' or 'invoice'
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [currentInvoice, setCurrentInvoice] = useState(null)
  const [nativePaymentSupported, setNativePaymentSupported] = useState(false)

  // Check if native payment is supported
  useEffect(() => {
    setNativePaymentSupported(isSWHandlerPaymentAvailable())
  }, [])

  // Sync with Redux store
  useEffect(() => {
    setChannelBalance(channelBalanceFromStore)
  }, [channelBalanceFromStore])

  const depositAmount = (btcBalance * depositPercent) / 100

  const handleDeposit = async () => {
    if (depositAmount > btcBalance || depositAmount <= 0) {
      alert('Invalid deposit amount')
      return
    }

    setIsDepositing(true)

    // If using invoice method
    if (depositMethod === 'invoice') {
      try {
        const invoice = await generateStableChannelInvoice(depositAmount)
        setCurrentInvoice(invoice)
        
        // Try native payment via SWHandler first
        if (nativePaymentSupported) {
          try {
            console.log('Requesting stable channel payment via SWHandler...')
            
            // Use event-based payment flow (like habit tracker)
            requestStableChannelPayment(
              invoice,
              depositAmount,
              hostUrl,
              // On payment success callback
              (paymentResult) => {
                console.log('Stable channel payment successful:', paymentResult)
                dispatch(depositToStableChannel(depositAmount))
                setIsDepositing(false)
              },
              // On payment timeout/failure callback
              () => {
                console.log('Payment timeout or failed, showing QR code')
                setShowInvoiceModal(true)
                setIsDepositing(false)
              }
            )
            
            // Don't set isDepositing to false here - let callbacks handle it
            return
          } catch (paymentError) {
            console.log('SWHandler payment failed, showing invoice modal:', paymentError)
          }
        }
        
        // Fall back to showing invoice modal
        setShowInvoiceModal(true)
        setIsDepositing(false)
      } catch (error) {
        console.error('Error generating invoice:', error)
        alert('Failed to generate invoice')
        setIsDepositing(false)
      }
      return
    }

    // Instant deposit
    setTimeout(() => {
      dispatch(depositToStableChannel(depositAmount))
      setIsDepositing(false)
    }, 2000)
  }

  const handleInvoicePaymentConfirmed = () => {
    // Process the deposit
    dispatch(depositToStableChannel(depositAmount))
    setShowInvoiceModal(false)
    setCurrentInvoice(null)
  }

  const handleRebalance = () => {
    setIsRebalancing(true)
    const log = []

    // Simulate rebalancing process
    const steps = [
      { time: 1000, message: 'Analyzing channel balance...' },
      { time: 2000, message: 'Finding optimal rebalance routes...' },
      { time: 3000, message: 'Executing rebalancing transactions...' },
      { time: 4000, message: 'Rebalancing complete!' },
    ]

    steps.forEach((step, index) => {
      setTimeout(() => {
        log.push({ id: index, message: step.message, timestamp: new Date() })
        setRebalanceLog([...log])

        if (index === steps.length - 1) {
          setIsRebalancing(false)
          // Simulate slight balance adjustment after rebalancing
          const adjustment = (Math.random() - 0.5) * 0.0001
          setChannelBalance(prev => Math.max(0, prev + adjustment))
        }
      }, step.time)
    })
  }

  useEffect(() => {
    // Clear log when component mounts or rebalancing starts
    if (!isRebalancing) {
      setRebalanceLog([])
    }
  }, [isRebalancing])

  return (
    <div className="stable-screen">
      <div className="card">
        <h1>Stable Channels</h1>
        
        <div className="balance-info">
          <div className="balance-card">
            <div className="balance-label">Available BTC</div>
            <div className="balance-amount">{btcBalance.toFixed(8)} BTC</div>
          </div>
          
          <div className="balance-card channel">
            <div className="balance-label">Channel Balance</div>
            <div className="balance-amount">{channelBalance.toFixed(8)} BTC</div>
          </div>
        </div>

        <div className="deposit-section">
          <h2>Deposit to Stable Channel</h2>

          <div className="form-group">
            <label htmlFor="deposit-method">Deposit Method</label>
            <select
              id="deposit-method"
              value={depositMethod}
              onChange={(e) => setDepositMethod(e.target.value)}
              className="input"
            >
              <option value="instant">Instant (From Balance)</option>
              <option value="invoice">Lightning Invoice (P2P)</option>
            </select>
            <small>
              {depositMethod === 'instant'
                ? 'Instant deposit from your BTC balance'
                : nativePaymentSupported
                ? 'Pay via YakiHonne wallet or share invoice'
                : 'Generate invoice for others to fund your channel'}
            </small>
          </div>
          
          <div className="form-group">
            <label htmlFor="deposit-percent">
              Deposit Percentage: {depositPercent}%
            </label>
            <input
              id="deposit-percent"
              type="range"
              min="0"
              max="100"
              value={depositPercent}
              onChange={(e) => setDepositPercent(parseInt(e.target.value))}
              className="slider"
            />
            <div className="deposit-amount">
              Deposit Amount: <strong>{depositAmount.toFixed(8)} BTC</strong>
            </div>
          </div>

          <button
            onClick={handleDeposit}
            disabled={isDepositing || depositAmount <= 0 || (depositMethod === 'instant' && depositAmount > btcBalance)}
            className="button button-primary"
          >
            {isDepositing
              ? 'Processing...'
              : depositMethod === 'invoice'
              ? 'Generate Invoice'
              : 'Deposit to Channel'}
          </button>
        </div>

        {channelBalance > 0 && (
          <div className="rebalance-section">
            <h2>Channel Rebalancing</h2>
            <p className="section-description">
              Rebalance your Lightning Network channel for optimal routing and stability.
            </p>

            <button
              onClick={handleRebalance}
              disabled={isRebalancing}
              className="button button-secondary"
            >
              {isRebalancing ? 'Rebalancing...' : 'Start Rebalancing'}
            </button>

            {rebalanceLog.length > 0 && (
              <div className="rebalance-log">
                <h3>Rebalancing Log</h3>
                <div className="log-entries">
                  {rebalanceLog.map((entry) => (
                    <div key={entry.id} className="log-entry">
                      <span className="log-time">
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                      <span className="log-message">{entry.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {channelBalance === 0 && (
          <div className="empty-state">
            <p>No funds in stable channel. Deposit BTC to get started.</p>
          </div>
        )}

        {showInvoiceModal && currentInvoice && (
          <InvoiceModal
            invoice={currentInvoice}
            onClose={() => {
              setShowInvoiceModal(false)
              setCurrentInvoice(null)
              setIsDepositing(false)
            }}
            onPaymentConfirmed={handleInvoicePaymentConfirmed}
          />
        )}
      </div>
    </div>
  )
}

export default StableScreen

