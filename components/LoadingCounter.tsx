import React from 'react';
import { useAppStore } from '@/store';
import { motion, AnimatePresence } from 'motion/react';
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
          className="fixed top-5 right-3 z-50 bg-white/70 backdrop-blur-md shadow-lg rounded-full px-3.5 py-2 flex items-center gap-2 text-xs font-semibold text-slate-700 border border-secondary/40"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <Loader2 className="animate-spin" size={16} />
          <p className='flex'><span className='hidden lg:md:block mr-1'>Stations:</span> {stations.length.toLocaleString()}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingCounter;