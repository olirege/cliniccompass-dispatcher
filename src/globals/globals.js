import React, { createContext, useReducer } from 'react';

export const GlobalStateContext = createContext();

const initialState = {
  // Define your initial state here
};

const reducer = (state, action) => {
  // Handle actions and update state
};

export const GlobalStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <GlobalStateContext.Provider value={{ state, dispatch }}>
      {children}
    </GlobalStateContext.Provider>
  );
};

