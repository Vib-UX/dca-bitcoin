import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isConnected: false,
  userPubkey: null,
  userProfile: null,
  lightningAddress: null,
  hostUrl: null,
  isLoading: false,
  error: null,
};

const nostrSlice = createSlice({
  name: "nostr",
  initialState,
  reducers: {
    setConnected: (state, action) => {
      state.isConnected = action.payload;
    },
    setUserPubkey: (state, action) => {
      state.userPubkey = action.payload;
    },
    setUserProfile: (state, action) => {
      state.userProfile = action.payload;
    },
    setLightningAddress: (state, action) => {
      state.lightningAddress = action.payload;
    },
    setHostUrl: (state, action) => {
      state.hostUrl = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    disconnect: (state) => {
      state.isConnected = false;
      state.userPubkey = null;
      state.userProfile = null;
      state.lightningAddress = null;
      state.hostUrl = null;
    },
  },
});

export const {
  setConnected,
  setUserPubkey,
  setUserProfile,
  setLightningAddress,
  setHostUrl,
  setLoading,
  setError,
  disconnect,
} = nostrSlice.actions;

export default nostrSlice.reducer;

