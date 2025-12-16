import NDK from "@nostr-dev-kit/ndk";
import NDKCacheAdapterDexie from "@nostr-dev-kit/ndk-cache-dexie";

const relaysOnPlatform = [
  "wss://nostr-01.yakihonne.com",
  "wss://nostr-02.yakihonne.com",
  "wss://relay.damus.io",
  "wss://relay.nostr.band",
  "wss://nos.lol",
];

const ndkInstance = new NDK({
  explicitRelayUrls: relaysOnPlatform,
});

// Setup cache adapter
ndkInstance.cacheAdapter = new NDKCacheAdapterDexie({
  dbName: "dca-bitcoin-ndk-store",
});

// Setup signer from window.nostr (browser extension)
if (typeof window !== 'undefined' && window.nostr) {
  ndkInstance.signer = {
    async sign(event) {
      return await window.nostr.signEvent(event);
    },
    async user() {
      const pubkey = await window.nostr.getPublicKey();
      return { pubkey };
    },
  };
  console.log('✅ NDK signer configured from browser extension');
}

// Connection state
let isConnecting = false;
let isConnected = false;

// Ensure NDK is connected before use
export const ensureConnected = async () => {
  if (isConnected) {
    return true;
  }
  
  if (isConnecting) {
    // Wait for existing connection attempt
    let attempts = 0;
    while (isConnecting && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    return isConnected;
  }
  
  try {
    isConnecting = true;
    console.log('🔄 Connecting to Nostr relays...');
    await ndkInstance.connect();
    isConnected = true;
    console.log('✅ Connected to Nostr relays');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Nostr relays:', error);
    return false;
  } finally {
    isConnecting = false;
  }
};

// Start connection immediately
ensureConnected();

export { ndkInstance, relaysOnPlatform };

// Setup signer when user logs in
export const setupSigner = () => {
  if (typeof window !== 'undefined' && window.nostr && !ndkInstance.signer) {
    ndkInstance.signer = {
      async sign(event) {
        return await window.nostr.signEvent(event);
      },
      async user() {
        const pubkey = await window.nostr.getPublicKey();
        return { pubkey };
      },
    };
    console.log('✅ NDK signer configured');
  }
};

export const addExplicitRelays = (relayList) => {
  try {
    if (!Array.isArray(relayList)) return;
    let tempRelayList = relayList.filter(
      (relay) => !ndkInstance.explicitRelayUrls.includes(`${relay}`)
    );
    if (tempRelayList.length === 0) return;
    for (let relay of tempRelayList) {
      ndkInstance.addExplicitRelay(relay, undefined, true);
    }
  } catch (err) {
    console.log(err);
  }
};

