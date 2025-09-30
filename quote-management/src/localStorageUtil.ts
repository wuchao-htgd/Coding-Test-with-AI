// src/localStorageUtil.ts
import { Quote } from './types';

// LocalStorage key (avoid collisions)
const STORAGE_KEY = 'quote_management_data';

/** Save quotes to LocalStorage */
export const saveQuotesToLocalStorage = (quotes: Quote[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
  } catch (error) {
    console.error('Failed to save to LocalStorage:', error);
  }
};

/** Read quotes from LocalStorage */
export const getQuotesFromLocalStorage = (): Quote[] | null => {
  try {
    const storedStr = localStorage.getItem(STORAGE_KEY);
    return storedStr ? JSON.parse(storedStr) as Quote[] : null;
  } catch (error) {
    console.error('Failed to read from LocalStorage:', error);
    return null;
  }
};