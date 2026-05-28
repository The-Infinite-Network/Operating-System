import { create } from "zustand";

const CURRENT_STUDENT_KEY = "unschool_current_student_v2";

interface UnschoolState {
  currentStudentId: string | null;
  setCurrentStudentId: (studentId: string | null) => void;
  refreshToken: number;
  bumpRefresh: () => void;
}

export const useUnschoolStore = create<UnschoolState>((set) => ({
  currentStudentId:
    typeof window !== "undefined"
      ? window.localStorage.getItem(CURRENT_STUDENT_KEY)
      : null,
  setCurrentStudentId: (studentId) => {
    if (typeof window !== "undefined") {
      if (studentId) {
        window.localStorage.setItem(CURRENT_STUDENT_KEY, studentId);
      } else {
        window.localStorage.removeItem(CURRENT_STUDENT_KEY);
      }
    }
    set({ currentStudentId: studentId });
  },
  refreshToken: 0,
  bumpRefresh: () => set((state) => ({ refreshToken: state.refreshToken + 1 })),
}));
