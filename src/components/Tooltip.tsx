import React from 'react';
import { type Station } from '../services/radioApi';

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
  tooltipPosition 
}) => {
  console.log("hoveredStation: ", hoveredStation);
  console.log("hoveredPolygon: ", hoveredPolygon);
  if (!hoveredStation && !hoveredPolygon) {
    return null;
  }
  
  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: tooltipPosition.x,
        top: tooltipPosition.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      {hoveredStation ? (
        <div className="bg-black bg-opacity-90 text-white p-3 rounded-lg border border-blue-500 shadow-lg max-w-xs">
          <div className="font-bold text-sm mb-1">{hoveredStation.name}</div>
          <div className="text-xs opacity-80">{hoveredStation.country}</div>
          {hoveredStation.tags && (
            <div className="text-xs opacity-70 mt-1">
              {Array.isArray(hoveredStation.tags) 
                ? hoveredStation.tags.slice(0, 3).join(', ')
                : String(hoveredStation.tags).split(',').slice(0, 3).join(', ')
              }
            </div>
          )}
        </div>
      ) : hoveredPolygon ? (
        <div className="bg-black bg-opacity-90 text-white p-3 rounded-lg border border-blue-500 shadow-lg">
          <div className="font-bold text-sm">
            {hoveredPolygon.properties?.NAME_LONG || 
             hoveredPolygon.properties?.NAME || 
             hoveredPolygon.properties?.ABBREV || 
             "Unknown Country"}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Tooltip;