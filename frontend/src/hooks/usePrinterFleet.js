import { createContext, useContext } from 'react';

export const PrinterFleetContext = createContext({
    printers: [],
    scheduleJobs: [],
    confirmQueue: [],
    setPrinters: () => {},
    setScheduleJobs: () => {},
    setConfirmQueue: () => {},
});

export function usePrinterFleet() {
    return useContext(PrinterFleetContext);
}