import { createContext, useContext } from 'react';

export const MaterialsContext = createContext({
    filaments: [],
    resins: [],
    powders: [],
    setFilaments: () => {},
    setResins: () => {},
    setPowders: () => {},
});

export function useMaterials() {
    return useContext(MaterialsContext);
}