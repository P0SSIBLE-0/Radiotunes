// src/components/MapView/HoverTooltip.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio } from 'lucide-react';
import type { Station } from '../../types/radio.t';

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

  const tooltipVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 25 } },
    exit: { opacity: 0, y: 5, scale: 0.9, transition: { duration: 0.1 } },
  };

  return (
    <AnimatePresence>
      {info && (
        <motion.div
          className="hover-tooltip max-w-xs"
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
          <div className="tooltip-favicon-container">
            {!showFallbackIcon && info.station.favicon ? (
              <img
                src={info.station.favicon}
                alt={info.station.name}
                className="tooltip-favicon"
                onError={handleImageError}
              />
            ) : (
              <Radio className="tooltip-fallback-icon" />
            )}
          </div>
          <div className="tooltip-text-container">
            <div className="tooltip-name text-wrap">{info.station.name}</div>
            <div className="tooltip-country text-wrap">{info.station.country}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HoverTooltip;