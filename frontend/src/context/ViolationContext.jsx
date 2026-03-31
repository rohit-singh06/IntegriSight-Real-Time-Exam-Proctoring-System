// ViolationContext.jsx
// handles the global state for violations 
// mainly so we don't have to keep passing props down everywhere

import React, { createContext, useState, useEffect } from 'react';

export const ViolationContext = createContext();

export function ViolationProvider({ children }) {
  const [violations, setViolations] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('integrisight_violations');
    if (saved) {
      try {
        setViolations(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to parse violations", err);
      }
    }
  }, []);

  // localStorage key is different from the violations context key
  // took me a while to figure out why they weren't syncing
  useEffect(() => {
    localStorage.setItem('integrisight_violations', JSON.stringify(violations));
    window.dispatchEvent(new Event('integrisight_update'));
  }, [violations]);


  useEffect(() => {
    // sync across tabs
    const handleStorage = (e) => {
      if (e.key === 'integrisight_violations') {
        if (e.newValue) {
          try {
            setViolations(JSON.parse(e.newValue));
          } catch (err) {}
        } else {
          setViolations([]);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const addViolation = (entry) => {
    setViolations((prev) => [entry, ...prev]);
  };

  const clearViolations = () => {
    setViolations([]);
  };

  return (
    <ViolationContext.Provider value={{ violations, addViolation, clearViolations }}>
      {children}
    </ViolationContext.Provider>
  );
}
