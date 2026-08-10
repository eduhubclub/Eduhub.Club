import { createContext } from 'react';

/** Stable context identity — keep createContext out of the Provider module for HMR. */
export const AttendanceContext = createContext(null);
