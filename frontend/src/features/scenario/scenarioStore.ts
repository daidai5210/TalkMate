import { create } from 'zustand';
import type { Scenario } from './types';
import { listScenarios } from './scenarioService';

interface ScenarioState {
  scenarios: Scenario[];
  loading: boolean;
  error: string | null;
  fetched: boolean;
  fetchScenarios: () => Promise<void>;
  reset: () => void;
}

export const useScenarioStore = create<ScenarioState>((set) => ({
  scenarios: [],
  loading: false,
  error: null,
  fetched: false,
  fetchScenarios: async () => {
    set({ loading: true, error: null });
    try {
      const scenarios = await listScenarios();
      set({ scenarios, loading: false, fetched: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取场景失败';
      set({ loading: false, error: message, fetched: true });
    }
  },
  reset: () => set({ scenarios: [], loading: false, error: null, fetched: false }),
}));
