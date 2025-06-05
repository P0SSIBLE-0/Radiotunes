import React from "react";
import { type Station } from "../services/radioApi";
import { AnimatePresence, motion } from "framer-motion"; // Changed from "motion/react"
import { Radio } from "lucide-react";

interface GeoJsonFeature {
  type: string;
  properties: {
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

interface TooltipProps {
  hoveredStation: Station | null;
  hoveredPolygon: GeoJsonFeature | null;
  tooltipPosition: { x: number; y: number };
}

const Tooltip: React.FC<TooltipProps> = ({
  hoveredStation,
  hoveredPolygon,
  tooltipPosition,
}) => {
  if (!hoveredStation && !hoveredPolygon) {
    return null;
  }

  return (
    <AnimatePresence>
      {hoveredStation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="fixed z-50 pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="flex items-center bg-gray-100 bg-opacity-90 text-black p-3 rounded-lg border-2 border-gray-300 shadow-xl max-w-xs min-w-72 font-sans">
            <div className="w-10">
              {hoveredStation?.favicon ? (
                <img src={hoveredStation.favicon} alt="Station Icon" className="w-full h-full object-contain" />
              ) : (
                <Radio className="size-5 ml-1"/>
              )}
            </div>
            <div className="ml-2 flex-1">
            <div className="font-bold text-sm mb-1">{hoveredStation?.name}</div>
            <div className="text-xs opacity-80">{hoveredStation?.country}</div>
            {hoveredStation?.tags && (
              <div className="text-xs opacity-70 mt-1">
                {Array.isArray(hoveredStation?.tags)
                  ? hoveredStation?.tags.slice(0, 3).join(", ")
                  : String(hoveredStation?.tags)
                      .split(",")
                      .slice(0, 3)
                      .join(", ")}
              </div>
            )}
          </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Tooltip;