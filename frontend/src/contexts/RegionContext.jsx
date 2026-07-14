import { createContext, useState, useContext } from 'react';

const RegionContext = createContext();

export function RegionProvider({ children }) {
  const [selectedRegion, setSelectedRegion] = useState(''); // '' means All

  return (
    <RegionContext.Provider value={{ selectedRegion, setSelectedRegion }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  return useContext(RegionContext);
}
