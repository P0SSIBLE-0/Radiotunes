import React, { useMemo, useState, useCallback } from "react";
import { type GlobeMethods } from "react-globe.gl";
import { type Station } from "../services/radioApi";

interface GlobePoint {
  lat: number;
  lng: number;
  size: number;
  color: string;
  station: Station;
  index: number;
}

interface StationPointsProps {
  stations: Station[];
  currentStation: Station | null;
  selectStation: (station: Station, index: number) => void;
  setHoveredStation: (station: Station | null) => void;
  setTooltipPosition: (position: { x: number; y: number }) => void;
  globeEl: React.MutableRefObject<GlobeMethods | undefined>;
  hoveredStation: Station | null;
}

const StationPoints: React.FC<StationPointsProps> = ({
  stations,
  currentStation,
  selectStation,
  setHoveredStation,
  setTooltipPosition,
  globeEl,
  hoveredStation,
}) => {
  const [lastTap, setLastTap] = useState(0);

  const globeData = useMemo(() => {
    return stations
      .filter((station) => station.geo_lat != null && station.geo_long != null)
      .map((station, index) => ({
        lat: station.geo_lat!,
        lng: station.geo_long!,
        size: 0.03,
        color: "rgb(55, 65, 81)",
        station,
        index,
      }));
  }, [stations]);

  const handlePointClick = useCallback(
    (point: GlobePoint, event: MouseEvent) => {
      const { station, index } = point;
      if (station && typeof index === "number") {
        selectStation(station, index);
        if (globeEl.current && station.geo_lat && station.geo_long) {
          const now = Date.now();
          const DOUBLE_TAP_DELAY = 300;
          if (now - lastTap < DOUBLE_TAP_DELAY) {
            globeEl.current.pointOfView(
              { lat: station.geo_lat, lng: station.geo_long, altitude: 0.2 },
              500
            );
          } else {
            globeEl.current.pointOfView(
              { lat: station.geo_lat, lng: station.geo_long, altitude: 0.5 },
              1000
            );
          }
          setLastTap(now);
        }
      }
    },
    [lastTap, selectStation, globeEl]
  );

  const handlePointHover = useCallback(
    (point: GlobePoint | null, prevPoint: GlobePoint | null, event?: Event) => {
      if (!(event instanceof MouseEvent)) return;
      if (point) {
        const { station } = point;
        setHoveredStation(station);
        const canvas = event.target as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const x = Math.min(
          event.clientX - rect.left + 15,
          window.innerWidth - 200 // Assume tooltip width ~200px
        );
        const y = Math.min(
          event.clientY - rect.top - 30, // Assume tooltip height ~60px
          window.innerHeight - 60
        );
        setTooltipPosition({ x, y });
      } else {
        setHoveredStation(null);
      }
    },
    [setHoveredStation, setTooltipPosition]
  );

  return {
    pointsData: globeData,
    pointAltitude: "size" as const,
    pointColor: (point: GlobePoint) =>
      point.station === hoveredStation ? "rgb(239, 68, 68)" : "rgb(55, 65, 81)",
    pointLabel: (point: GlobePoint) => {
      const station = point?.station;
      return `
        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          color: '#1e293b',
          padding: '4px 8px',
          borderRadius: '4px',
          fontFamily: 'sans-serif',
          fontSize: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          ${station?.name || "Unknown"}
        </div>
      `;
    },
    onPointHover: handlePointHover,
    onPointClick: handlePointClick,
    pointsMerge: true,
    pointsTransitionDuration: 1000,
    pointRadius: (point: GlobePoint) =>
      point.station === hoveredStation ? 0.05 : 0.03,
    pointResolution: 32,
  };
};

export default StationPoints;