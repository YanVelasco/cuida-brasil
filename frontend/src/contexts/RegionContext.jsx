import { createContext, useState, useContext } from 'react';

const RegionContext = createContext();

export function RegionProvider({ children }) {
  const [selectedRegion, setSelectedRegion] = useState(''); // '' means All
  const [availableRegions, setAvailableRegions] = useState([]);

  return (
    <RegionContext.Provider value={{ selectedRegion, setSelectedRegion, availableRegions, setAvailableRegions }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  return useContext(RegionContext);
}
