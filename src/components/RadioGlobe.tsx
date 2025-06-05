import React, { useEffect, useRef, useState } from "react";
import * as topojson from "topojson-client";
import { useRadioStore } from "../store/radioStore";
import Tooltip from "./Tooltip";
import GlobeRenderer from "./GlobeRenderer";
// import { Station } from "../services/radioApi";
import { type Station, type StationResponse } from "radio-browser-api";
// Define types
interface GeoJsonFeature extends GeoJSON.Feature<GeoJSON.Geometry, any> {}

interface WindowSize {
  width: number;
  height: number;
}

interface GlobePoint {
  lat: number;
  lng: number;
  size: number;
  color: string;
  station: Station;
  index: number;
  hovered?: boolean;
}

const RadioGlobe: React.FC = () => {
  const { stations, currentStation, selectStation, isLoadingStations, play } =
    useRadioStore();
  const [landPolygons, setLandPolygons] = useState<GeoJsonFeature[]>([]);
  const [hoveredStation, setHoveredStation] = useState<StationResponse | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const [hoveredPolygon, setHoveredPolygon] = useState<GeoJsonFeature | null>(
    null
  );
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);


  // Load world map data
  useEffect(() => {
    console.log("Fetching GeoJSON data...");
    const geoJsonUrl =
      "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";

    fetch(geoJsonUrl)
      .then((res) => {
        console.log("GeoJSON response status:", res.status);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("GeoJSON data received:", data);
        if (
          data &&
          data.type === "FeatureCollection" &&
          Array.isArray(data.features)
        ) {
          console.log(`Loaded ${data.features.length} features`);
          setLandPolygons(data.features as GeoJsonFeature[]);
        } else {
          console.error("Invalid GeoJSON format:", data);
        }
      })
      .catch((err) => {
        console.error("Error fetching GeoJSON:", err);
        console.log("Trying fallback GeoJSON source...");
        fetch("https://unpkg.com/world-atlas/countries-110m.json")
          .then((res) => res.json())
          .then((data) => {
            if (data.objects && data.objects.countries) {
              const countries = topojson.feature(
                data,
                data.objects.countries
              ) as unknown as GeoJsonFeature[];
              console.log(
                "Fallback features loaded:",
                countries.length
              );
              setLandPolygons(countries);
            }
          })
          .catch((fallbackErr) =>
            console.error("Fallback source also failed:", fallbackErr)
          );
      });
  }, []);

  // Prepare station points data
  const globePointsData = React.useMemo(() => {
    return stations
      .filter((station) => station.geo_lat != null && station.geo_long != null)
      .map((station, index) => ({
        lat: station.geo_lat!,
        lng: station.geo_long!,
        size: currentStation?.stationuuid === station.stationuuid ? 0.8 : 0.4,
        color:
          currentStation?.stationuuid === station.stationuuid
            ? "#111"
            : "#374151",
        station,
        index,
        hovered: hoveredStation?.stationuuid === station.stationuuid,
      }));
  }, [stations, currentStation]);

  // Handle point click
  const handlePointClick = React.useCallback(
    (point: GlobePoint) => {
      const { station, index } = point;
      if (station && typeof index === "number") {
        console.log("Station clicked:", station.name);
        try {
          selectStation(station, index);
          // Auto-play the selected station
          setTimeout(() => {
            console.log("Attempting to play station:", station.name);
            play().then(() => {
              console.log("Station played successfully");
            }).catch((error) => {
              console.error("Error playing station:", error);
            });
          }, 100);
        } catch (error) {
          console.error("Error selecting/playing station:", error);
        }
      }
    },
    [selectStation, play, hoveredStation]
  );

  // Handle point hover
  // In RadioGlobe.tsx
  const handlePointHover = React.useCallback(
    (point: any, event?: MouseEvent) => {
      if (point) {
        const stationPoint = point as GlobePoint;
        setHoveredStation(stationPoint.station);
      } else {
        setHoveredStation(null);
      }

      if (event) {
        setTooltipPosition({
          x: event.clientX,
          y: event.clientY,
        });
      }
    },
    [setHoveredStation, setTooltipPosition]
  );

  if (landPolygons.length === 0 || isLoadingStations) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white">
        <div className="mb-4 text-xl">Loading Radio Globe...</div>
        <div className="w-64 h-1 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 animate-pulse"
            style={{ width: "60%" }}
          ></div>
        </div>
        {landPolygons.length === 0 && (
          <div className="mt-4 text-sm text-gray-400">
            Loading world map data...
          </div>
        )}
        {isLoadingStations && (
          <div className="mt-2 text-sm text-gray-400">
            Loading radio stations...
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-900">
      <GlobeRenderer
        landPolygons={landPolygons}
        currentStation={currentStation}
        setHoveredPolygon={setHoveredPolygon}
        onPointClick={handlePointClick}
        onPointHover={handlePointHover}
        pointsData={globePointsData}
        windowSize={windowSize}
      >
        {/* Custom point labels */}
        {globePointsData.map((point) => (
          <div
            key={`${point.lat}-${point.lng}-${point.station.stationuuid}`}
            style={{
              position: "absolute",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              opacity: point.hovered ? 1 : 0,
              transition: "opacity 0.2s",
              background: "rgba(0, 0, 0, 0.8)",
              color: "white",
              padding: "4px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              whiteSpace: "nowrap",
            }}
          >
            {point.station.name}
          </div>
        ))}
      </GlobeRenderer>

      {/* Tooltip for hovered station */}
      <Tooltip
        hoveredStation={hoveredStation}
        hoveredPolygon={hoveredPolygon}
        tooltipPosition={tooltipPosition}
      />
    </div>
  );
};

export default RadioGlobe;
