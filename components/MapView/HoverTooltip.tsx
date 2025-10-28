// src/components/MapView/HoverTooltip.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'motion/react';
import { Radio } from 'lucide-react';
import type { Station } from '@/types/radio.t.ts';

interface HoverTooltipProps {
  info: {
    station: Station;
    x: number;
    y: number;
  } | null;
}

const HoverTooltip: React.FC<HoverTooltipProps> = ({ info }) => {
  const [showFallbackIcon, setShowFallbackIcon] = useState(false);

  useEffect(() => {
    // Reset the fallback state whenever the hovered station changes
    if (info?.station.favicon) {
      setShowFallbackIcon(false);
    } else {
      setShowFallbackIcon(true);
    }
  }, [info]);

  const handleImageError = () => {
    setShowFallbackIcon(true);
  };

  const tooltipVariants: Variants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 25 } },
    exit: { opacity: 0, y: 5, scale: 0.9, transition: { duration: 0.1 } },
  };

  return (
    <AnimatePresence>
      {info && (
        <motion.div
          className="bg-white dark:bg-zinc-900 text-primary flex max-w-xs gap-2 px-3 py-2.5 rounded-lg items-center justify-center font-sans"
          style={{
            position: 'fixed',
            left: info.x,
            top: info.y,
            pointerEvents: 'none', // Allow mouse events to pass through to the map
            zIndex: 10000,
          }}
          variants={tooltipVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="size-10 overflow-hidden rounded-xl flex items-center justify-center">
            {!showFallbackIcon && info.station.favicon ? (
              <img
                src={info.station.favicon}
                alt={info.station.name}
                className="w-full h-full object-cover rounded-xl"
                onError={handleImageError}
              />
            ) : (
              <Radio className="size-6 m-auto" />
            )}
          </div>
          <div className="tooltip-text-container flex-1">
            <div className="tooltip-name text-wrap font-semibold">{info.station.name}</div>
            <div className="tooltip-country text-wrap text-xs opacity-80">{info.station.country}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HoverTooltip;