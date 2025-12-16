import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  btcBalance: 0,
  btcPrice: 86087.97,
  btcPrice24h: 86087.97 * 0.95,
  purchaseHistory: [],
  stableChannelBalance: 0,
};

const dcaSlice = createSlice({
  name: "dca",
  initialState,
  reducers: {
    setBtcBalance: (state, action) => {
      state.btcBalance = action.payload;
    },
    addToBtcBalance: (state, action) => {
      state.btcBalance += action.payload;
    },
    setBtcPrice: (state, action) => {
      state.btcPrice = action.payload;
    },
    setBtcPrice24h: (state, action) => {
      state.btcPrice24h = action.payload;
    },
    addPurchase: (state, action) => {
      state.purchaseHistory.unshift(action.payload);
    },
    setPurchaseHistory: (state, action) => {
      state.purchaseHistory = action.payload;
    },
    setStableChannelBalance: (state, action) => {
      state.stableChannelBalance = action.payload;
    },
    depositToStableChannel: (state, action) => {
      const amount = action.payload;
      state.btcBalance -= amount;
      state.stableChannelBalance += amount;
    },
  },
});

export const {
  setBtcBalance,
  addToBtcBalance,
  setBtcPrice,
  setBtcPrice24h,
  addPurchase,
  setPurchaseHistory,
  setStableChannelBalance,
  depositToStableChannel,
} = dcaSlice.actions;

export default dcaSlice.reducer;

