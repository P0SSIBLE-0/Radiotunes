// src/store/index.ts
import { create } from 'zustand';
import type { RadioState } from '../types/radio.t';

import { createStationSlice } from './stationSlice';
import { createPlayerSlice } from './playerSlice';
import { createUserSlice } from './userSlice';

// This is the hook your components will use.
// It combines the state and actions from all slices.
export const useAppStore = create<RadioState>()((...a) => ({
  ...createStationSlice(...a),
  ...createPlayerSlice(...a),
  ...createUserSlice(...a),
}));