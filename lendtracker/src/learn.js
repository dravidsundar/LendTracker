import { configureStore, createSlice } from "@reduxjs/toolkit";

// Create a slice (state + reducers together)
const counterSlice = createSlice({
  name: "counter",
  initialState: { counter: 0 },

  reducers: {
    increment: (state) => {
      state.counter += 1; // Immer handles immutability
    },
    decrement: (state) => {
      state.counter -= 1;
    },
  },
});

// Export actions
export const { increment, decrement } = counterSlice.actions;

// Configure the store
const store = configureStore({
  reducer: counterSlice.reducer,
});

// Example usage
console.log(store.getState()); // { counter: 0 }

store.dispatch(increment());
console.log(store.getState()); // { counter: 1 }

store.dispatch(decrement());
console.log(store.getState()); // { counter: 0 }
