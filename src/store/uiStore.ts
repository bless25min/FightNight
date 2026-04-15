import { create } from 'zustand'

type UIState = {
  expandedFaq: string | null
  toggleFaq: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  expandedFaq: null,
  toggleFaq: (id) =>
    set((state) => ({
      expandedFaq: state.expandedFaq === id ? null : id,
    })),
}))
