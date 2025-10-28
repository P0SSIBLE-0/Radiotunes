// src/store/index.ts
import { create } from 'zustand';
import type { RadioState } from '@/types/radio.t.ts';

import { createStationSlice } from '@/store/stationSlice';
import { createPlayerSlice } from '@/store/playerSlice';
import { createUserSlice } from '@/store/userSlice';

// This is the hook your components will use.
// It combines the state and actions from all slices.
export const useAppStore = create<RadioState>()((...a) => ({
  ...createStationSlice(...a),
  ...createPlayerSlice(...a),
  ...createUserSlice(...a),
}));