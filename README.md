# DCA Bitcoin on Nostr ⚡

A decentralized Dollar Cost Averaging Bitcoin app built on Nostr protocol with Lightning Network integration.

## Quick Start

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` and connect with your Nostr identity!

## Features

### 🔑 Nostr Integration

- **Decentralized Identity**: Connect with Nostr browser extension or public key
- **On-Chain Publishing**: All DCA purchases published to Nostr relays (kind 31111)
- **Cross-Device Sync**: Access purchase history from anywhere
- **Profile Integration**: Display Nostr profile & Lightning address

### 💰 DCA Functionality

- **Multi-Currency Support**: USD, IDR (Indonesian Rupiah), INR (Indian Rupee)
- **Real-Time Conversion**: Uses 24-hour BTC price for stable conversions
- **Silent Payments**: Support for BIP-352 Silent Payment addresses
- **Auto-Publishing**: Purchases automatically saved to Nostr relays
- **P2P Lightning Invoices**: Generate invoices for marketplace orders
- **Mock & Real Payments**: Test with instant payment or use Lightning invoices

### ⚡ Lightning & Channels

- **Wallet Tracking**: Monitor BTC balance and USD value
- **Price Alerts**: Get notified on 20%+ price movements
- **Stable Channels**: Deposit to Lightning channels with mock rebalancing
- **Lightning Invoices**: Generate bolt11 invoices with QR codes
- **P2P Channel Funding**: Generate invoices for others to fund your channels
- **Lightning Ready**: Infrastructure for NIP-57 zaps and NWC

### 📊 Analytics & Marketplace

- **History Screen**: View all purchases from Nostr relays
- **DCA Statistics**: Total BTC, USD spent, average price, purchase count
- **P2P Marketplace**: Browse and fulfill DCA orders with Lightning
- **Order Filtering**: Filter by currency (USD/IDR/INR)
- **Real-Time Updates**: Live marketplace feed from Nostr relays
- **Verifiable Records**: All purchases and orders cryptographically signed

## Architecture

Built with modern React and Nostr Dev Kit (NDK):

- React 18 + Vite
- Redux Toolkit for state management
- @nostr-dev-kit/ndk for Nostr protocol
- nostr-tools for low-level operations
- Smart Widget Handler for YakiHonne integration

See [NOSTR_INTEGRATION.md](./NOSTR_INTEGRATION.md) for detailed architecture.

## Nostr Event Structure

DCA purchases use custom event **kind 31111**:

```json
{
  "kind": 31111,
  "content": {
    "fiatAmount": 1000,
    "currency": "USD",
    "btcAmount": 0.01161329,
    "btcPrice": 86087.97,
    "timestamp": 1704067200000,
    "silentPaymentAddress": "sp1..."
  },
  "tags": [
    ["d", "dca-1704067200000"],
    ["currency", "USD"],
    ["btc_amount", "0.01161329"],
    ["app", "dca-bitcoin"]
  ]
}
```

## Development

### Install Dependencies

```bash
npm install
```

### Run Dev Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

## Usage

1. **Connect**: Use Nostr browser extension (nos2x, Alby) or enter npub/pubkey
2. **DCA**: Make purchases with mock payment or Lightning invoices
3. **Marketplace**: Browse P2P orders and fulfill with Lightning
4. **Track**: Monitor balance, price changes, and stable channel deposits
5. **History**: View all purchases synced from Nostr relays

### Creating P2P Orders

1. Navigate to **DCA** screen
2. Select **Lightning Invoice (P2P)** payment method
3. Enter fiat amount and Silent Payment address
4. Click **Generate Invoice**
5. Share QR code or invoice string
6. Wait for payment from marketplace participants

### Fulfilling Orders

1. Navigate to **Market** screen
2. Browse active orders
3. Filter by currency if desired
4. Click **⚡ Pay Invoice** on any order
5. Scan QR or copy invoice to your wallet
6. BTC sent to seller's Silent Payment address

## Relays

Connected to:

- wss://nostr-01.yakihonne.com
- wss://nostr-02.yakihonne.com
- wss://relay.damus.io
- wss://relay.nostr.band
- wss://nos.lol

## Roadmap

- [x] P2P Lightning invoice marketplace ✅
- [x] Invoice QR code generation ✅
- [x] Marketplace order filtering ✅
- [x] Stable channel invoice funding ✅
- [ ] Real Lightning node integration (LNbits, BTCPay)
- [ ] HODL invoices for escrow
- [ ] Automated DCA scheduling
- [ ] Silent Payment wallet integration
- [ ] Reputation system (NIP-05)
- [ ] Order matching algorithm
- [ ] Social features (follow DCA strategies)

## Documentation

- [P2P_MARKETPLACE.md](./P2P_MARKETPLACE.md) - Lightning invoice marketplace guide
- [NOSTR_INTEGRATION.md](./NOSTR_INTEGRATION.md) - Nostr protocol details
- [MOBILE_GUIDE.md](./MOBILE_GUIDE.md) - Mobile optimization & YakiHonne
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment guide
- [QUICKSTART.md](./QUICKSTART.md) - Quick start guide

## Reference

Inspired by the [AI Habit Tracker](https://github.com/Vib-UX/agentic-mini-apps/tree/main/mini-app-04.ai-habit-tracker) mini-app architecture.

## License

MIT

---

**Stack sats. Stay humble. Build on Nostr. ⚡🧡**
