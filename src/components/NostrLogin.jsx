import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  setConnected,
  setUserPubkey,
  setUserProfile,
  setLightningAddress,
  setLoading,
  setError,
} from "../store/nostrSlice";
import { getUserProfile, getLightningAddress, decodeNostrAddress } from "../helpers/NostrHelpers";
import { setupSigner } from "../helpers/NostrInstance";
import "./NostrLogin.css";

function NostrLogin() {
  const dispatch = useDispatch();
  const [manualPubkey, setManualPubkey] = useState("");

  const connectWithExtension = async () => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      if (!window.nostr) {
        throw new Error("Nostr extension not found. Please install a Nostr extension like nos2x or Alby.");
      }

      const pubkey = await window.nostr.getPublicKey();
      await handleConnection(pubkey);
    } catch (error) {
      console.error("Error connecting with extension:", error);
      dispatch(setError(error.message));
      dispatch(setLoading(false));
    }
  };

  const connectWithPubkey = async () => {
    if (!manualPubkey.trim()) {
      dispatch(setError("Please enter a pubkey or npub"));
      return;
    }

    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const pubkey = decodeNostrAddress(manualPubkey.trim());
      if (!pubkey) {
        throw new Error("Invalid pubkey or npub");
      }

      await handleConnection(pubkey);
    } catch (error) {
      console.error("Error connecting with pubkey:", error);
      dispatch(setError(error.message));
      dispatch(setLoading(false));
    }
  };

  const handleConnection = async (pubkey) => {
    try {
      dispatch(setUserPubkey(pubkey));

      // Setup NDK signer for publishing events
      setupSigner();

      // Fetch user profile
      const profile = await getUserProfile(pubkey);
      if (profile) {
        dispatch(setUserProfile(profile));
      }

      // Fetch lightning address
      const lnAddress = await getLightningAddress(pubkey);
      if (lnAddress) {
        dispatch(setLightningAddress(lnAddress));
      }

      dispatch(setConnected(true));
      dispatch(setLoading(false));
    } catch (error) {
      console.error("Error during connection:", error);
      dispatch(setError("Failed to fetch profile data"));
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="nostr-login-overlay">
      <div className="nostr-login-card">
        <h1>Connect to Nostr</h1>
        <p className="subtitle">Connect your Nostr identity to track DCA purchases on-chain</p>

        <div className="login-methods">
          <div className="method-section">
            <h3>Option 1: Browser Extension</h3>
            <p>Use your Nostr browser extension (nos2x, Alby, etc.)</p>
            <button onClick={connectWithExtension} className="button button-primary">
              Connect with Extension
            </button>
          </div>

          <div className="divider">OR</div>

          <div className="method-section">
            <h3>Option 2: Public Key</h3>
            <p>Enter your npub or hex pubkey (read-only)</p>
            <input
              type="text"
              value={manualPubkey}
              onChange={(e) => setManualPubkey(e.target.value)}
              placeholder="npub... or hex pubkey"
              className="input"
              onKeyPress={(e) => e.key === "Enter" && connectWithPubkey()}
            />
            <button onClick={connectWithPubkey} className="button button-secondary">
              Connect with Pubkey
            </button>
          </div>
        </div>

        <div className="info-box">
          <p>
            <strong>Why connect?</strong>
          </p>
          <ul>
            <li>Publish DCA purchases to Nostr relays</li>
            <li>Track your purchase history across devices</li>
            <li>Enable Lightning payments (coming soon)</li>
            <li>Build your Bitcoin DCA reputation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default NostrLogin;

