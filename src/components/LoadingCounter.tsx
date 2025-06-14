import React from 'react';
import { useAppStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const LoadingCounter: React.FC = () => {
  const { stations, allStationsLoaded, isLoadingStations } = useAppStore();

  if (isLoadingStations && stations.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {!allStationsLoaded && stations.length > 0 && (
        <motion.div
          className="fixed top-4 right-4 z-50 bg-white/70 backdrop-blur-md shadow-lg rounded-full px-4 py-2 flex items-center gap-3 text-sm font-medium text-slate-700"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <Loader2 className="animate-spin" size={16} />
          <span>Stations: {stations.length.toLocaleString()}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingCounter;