/** Global open-state for the ⌘K command palette (so any button can trigger it). */
export const palette = $state<{ open: boolean }>({ open: false });
