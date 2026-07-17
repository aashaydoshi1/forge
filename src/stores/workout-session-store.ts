import { create } from 'zustand';

interface WorkoutSessionState {
  isActive: boolean;
  sessionId: string | null;
  startSession: (sessionId: string) => void;
  endSession: () => void;
}

export const useWorkoutSessionStore = create<WorkoutSessionState>((set) => ({
  isActive: false,
  sessionId: null,
  startSession: (sessionId) => set({ isActive: true, sessionId }),
  endSession: () => set({ isActive: false, sessionId: null }),
}));
