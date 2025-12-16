import { configureStore } from "@reduxjs/toolkit";
import dcaReducer from "./dcaSlice";
import nostrReducer from "./nostrSlice";

export const store = configureStore({
  reducer: {
    dca: dcaReducer,
    nostr: nostrReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Disable for Nostr event objects
    }),
});

