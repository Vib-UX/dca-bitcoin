# DCA Bitcoin on Nostr

A decentralized Dollar-Cost Averaging (DCA) application for Bitcoin, built on Nostr with Lightning Network payments. Track your Bitcoin purchases, manage stable channels, and maintain privacy with Silent Payments.

## 🌟 Features

### 💰 DCA Purchase Flow

- **Multi-Currency Support**: Buy Bitcoin in USD, IDR (Indonesian Rupiah), or INR (Indian Rupee)
- **Direct Lightning Payments**: Pay directly to Lightning addresses via [YakiHonne](https://yakihonne.com) wallet
- **Silent Payments**: Receive Bitcoin privately using [BIP-352 Silent Payments](https://github.com/bitcoin/bips/blob/master/bip-0352.mediawiki)
  - Recommended wallet: [Silentium Wallet](https://github.com/AndySchroder/silentium) for Silent Payment address generation
- **Smart Widget Handler**: Native payment integration with YakiHonne using [smart-widget-handler](https://github.com/Vib-UX/smart-widget-handler) SDK

### ⚡ Stable Channels - Stabilize Your Bitcoin Gains

**Lock in your Bitcoin value using Lightning Network stable channels**. When BTC price increases, protect your gains by depositing into stable channels that maintain USD-equivalent value.

#### 📊 Portfolio Rebalance Example:

**Scenario**: You've accumulated 0.5 BTC through DCA purchases

| Event                 | BTC Price | Your BTC                      | USD Value                           | Action                   |
| --------------------- | --------- | ----------------------------- | ----------------------------------- | ------------------------ |
| **Initial DCA**       | $60,000   | 0.5 BTC                       | $30,000                             | Accumulating Bitcoin     |
| **BTC Pumps 40%**     | $84,000   | 0.5 BTC                       | $42,000                             | 🎯 **Rebalance Trigger** |
| **Deposit to Stable** | $84,000   | 0.3 BTC<br>+ 0.2 BTC (stable) | $25,200 (BTC)<br>+ $16,800 (stable) | Lock in $12,000 gains    |
| **BTC Drops 20%**     | $67,200   | 0.3 BTC<br>+ 0.2 BTC (stable) | $20,160 (BTC)<br>+ $16,800 (stable) | Protected value!         |

**Without Stable Channel**: 0.5 BTC @ $67,200 = $33,600 (-$8,400 from peak)  
**With Stable Channel**: $20,160 + $16,800 = **$36,960** (+$3,360 saved! ✅)

#### How Stable Channels Work:

1. **Deposit**: When BTC price rises, deposit a portion into Lightning stable channels
2. **Lock Value**: Your deposited BTC maintains its USD value regardless of price changes
3. **Withdraw**: Exit the channel anytime to convert back to regular Bitcoin
4. **Rebalance**: Optimize channel capacity for better Lightning routing

### 📱 Mobile-First Design

- Optimized for [YakiHonne](https://yakihonne.com) playground
- Progressive Web App (PWA) support
- Touch-friendly interface
- Responsive layout for all screen sizes

### 🔐 Privacy & Security

- **Silent Payments (BIP-352)**: Receive Bitcoin without address reuse
  - Generate addresses with [Silentium Wallet](https://github.com/AndySchroder/silentium)
  - No on-chain linkability between transactions
  - Enhanced privacy for all DCA purchases
- **Nostr Integration**: Your identity and history on decentralized relays
- **Lightning Payments**: Fast, low-fee Bitcoin transactions

### 🔮 Future: Post-Quantum Security

As Bitcoin evolves, we're preparing for quantum-resistant cryptography:

**ML-DSA (Module-Lattice-Based Digital Signature Algorithm)** - FIPS-204 standard for post-quantum signatures. See implementation example: [btc-vision/noble-post-quantum](https://github.com/btc-vision/noble-post-quantum)

This ensures your Bitcoin transactions remain secure even against quantum computers. The noble-post-quantum library provides:

- **ML-DSA**: Lattice-based signatures (FIPS-204)
- **ML-KEM**: Key encapsulation mechanism (FIPS-203)
- **SLH-DSA**: Hash-based signatures (FIPS-205)

Integration planned for future Nostr event signing and Bitcoin transaction security.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Nostr browser extension ([nos2x](https://github.com/fiatjaf/nos2x), [Alby](https://getalby.com))
- Lightning wallet with LNURL support

### Installation

```bash
# Clone the repository
git clone https://github.com/Vib-UX/dca-bitcoin.git
cd dca-bitcoin

# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

### For YakiHonne Users

1. Open YakiHonne app
2. Navigate to Widget Playground
3. Load the widget using `widget.json` configuration
4. Start DCA-ing Bitcoin with native payments!

## 🛠️ Tech Stack

### Frontend

- **React 18** - UI framework
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Vite** - Build tool & dev server

### Nostr Integration

- **NDK (@nostr-dev-kit/ndk)** - Nostr Development Kit
- **nostr-tools** - Core Nostr utilities
- **Dexie** - IndexedDB cache for Nostr events

### Lightning Network

- **smart-widget-handler** - Native payment integration for YakiHonne
- **LNURL** - Lightning address support
- **BIP-352 Silent Payments** - Privacy-preserving Bitcoin reception

### Relays

- wss://nostr-01.yakihonne.com
- wss://nostr-02.yakihonne.com
- wss://relay.damus.io
- wss://relay.nostr.band
- wss://nos.lol

## 📖 How It Works

### 1. DCA Purchase Flow

```
User Input → Calculate Sats → Request Payment → YakiHonne Approval → Success
```

**Example**: Buy $100 USD of Bitcoin

- BTC Price: $84,000
- Amount in BTC: 0.00119048 BTC (119,048 sats)
- Payment to: `predator@wallet.yakihonne.com`
- Silent Payment Address: Receive Bitcoin privately

### 2. Stable Channel Flow

```
Accumulate BTC → Price Rises → Deposit to Stable → Lock USD Value → Rebalance
```

**Strategy**:

1. DCA into Bitcoin regularly
2. When BTC pumps 30-50%, move 40% to stable channels
3. Lock in gains at higher prices
4. Buy back BTC when price dips

### 3. Nostr Publishing

All DCA purchases are published as Nostr events (kind 31111):

```json
{
  "kind": 31111,
  "content": {
    "fiatAmount": 100,
    "currency": "USD",
    "btcAmount": 0.00119048,
    "btcPrice": 84000,
    "silentPaymentAddress": "sp1...",
    "timestamp": 1735868876
  }
}
```

## 🎯 Use Cases

### For HODLers

- Automate Bitcoin accumulation with DCA
- Track all purchases on Nostr
- Protect gains with stable channels during bull runs

### For Privacy Advocates

- Use Silent Payments for anonymous Bitcoin reception
- No address reuse, no on-chain tracking
- Recommended: [Silentium Wallet](https://github.com/AndySchroder/silentium) for Silent Payment addresses

### For Lightning Users

- Instant payments via Lightning Network
- Low fees (<1%)
- Native YakiHonne integration

### For Nostr Natives

- Identity and history on Nostr
- Decentralized, censorship-resistant
- Portable across clients

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
VITE_DEFAULT_LIGHTNING_ADDRESS=yourname@wallet.yakihonne.com
VITE_ENABLE_MARKETPLACE=false
```

### Widget Configuration

Edit `widget.json` for YakiHonne integration:

```json
{
  "name": "DCA Bitcoin",
  "version": "1.0.0",
  "permissions": ["payment", "nostr"]
}
```

## 📱 Mobile & PWA

The app is optimized for mobile devices:

- **Viewport**: Configured for mobile screens
- **Touch**: Large, touch-friendly buttons
- **Responsive**: Adapts to all screen sizes
- **PWA**: Install as standalone app
- **Manifest**: `public/manifest.json`

## 🧪 Testing

```bash
# Run tests
npm test

# Run linter
npm run lint

# Build for production
npm run build
```

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🔗 Links

- **YakiHonne**: https://yakihonne.com - Nostr client with Smart Widget Handler
- **Smart Widget Handler**: https://github.com/Vib-UX/smart-widget-handler - Native payment SDK
- **Silentium Wallet**: https://github.com/AndySchroder/silentium - Silent Payment wallet
- **BIP-352**: https://github.com/bitcoin/bips/blob/master/bip-0352.mediawiki - Silent Payments spec
- **Noble Post-Quantum**: https://github.com/btc-vision/noble-post-quantum - Future quantum-resistant cryptography
- **Nostr**: https://nostr.com - Decentralized social protocol

## 🙏 Acknowledgments

- Built with [NDK](https://github.com/nostr-dev-kit/ndk)
- Lightning integration via [smart-widget-handler](https://github.com/Vib-UX/smart-widget-handler)
- Inspired by Bitcoin DCA strategies and privacy best practices
- Future-ready with [noble-post-quantum](https://github.com/btc-vision/noble-post-quantum) for ML-DSA integration

---

**⚡ Start DCA-ing Bitcoin today with privacy, Lightning speed, and gain protection!**
