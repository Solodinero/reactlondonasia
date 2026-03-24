import { create } from "zustand";
import { SessionLevels, SignalStatus, TradeSignal } from "@/types";

interface MonitorState {
  signals: TradeSignal[];
  sessionLevels: SessionLevels[];
  isConnected: boolean;
  addSignal: (signal: TradeSignal) => void;
  setSessionLevels: (levels: SessionLevels[]) => void;
  setConnected: (status: boolean) => void;
  updateSignalStatus: (id: string, status: SignalStatus) => void;
}

export const useMonitorStore = create<MonitorState>((set) => ({
  signals: [],
  sessionLevels: [],
  isConnected: false,
  addSignal: (signal) =>
    set((state) => ({
      signals: [signal, ...state.signals].slice(0, 100),
    })),
  setSessionLevels: (levels) => set({ sessionLevels: levels }),
  setConnected: (isConnected) => set({ isConnected }),
  updateSignalStatus: (id, status) =>
    set((state) => ({
      signals: state.signals.map((s) => (s.id === id ? { ...s, status } : s)),
    })),
}));
