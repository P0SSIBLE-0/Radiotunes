import React, { useEffect, useRef, useState } from "react";
import * as topojson from "topojson-client";
import { useRadioStore } from "../store/radioStore";
import { type Station } from "../services/radioApi";
import Globe, { type GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import * as d3 from "d3-geo";
import Tooltip from "./Tooltip";

// Define types
interface GeoJsonFeature extends GeoJSON.Feature<GeoJSON.Geometry, any> {}

interface GeoJsonFeatureCollection
  extends GeoJSON.FeatureCollection<GeoJSON.Geometry, any> {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

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
}

const RadioGlobe: React.FC = () => {
  const { stations, currentStation, selectStation, isLoadingStations, play } =
    useRadioStore();
  const [landPolygons, setLandPolygons] = useState<GeoJsonFeature[]>([]);
  const [hoveredStation, setHoveredStation] = useState<Station | null>(null);
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
  const globeEl = useRef<GlobeMethods | undefined>(undefined);
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

  // Initialize globe settings
  useEffect(() => {
    if (globeEl.current) {
      // Set up controls
      const controls = globeEl.current.controls();
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.3;
      controls.enableZoom = true;
      controls.enablePan = true;
      controls.enableRotate = true;
      controls.minDistance = 101;
      controls.maxDistance = 1000;

      // Set initial view
      globeEl.current.pointOfView({ altitude: 2.5 }, 0);
    }
  }, []);

  // Focus on current station
  useEffect(() => {
    if (
      globeEl.current &&
      currentStation?.geo_lat != null &&
      currentStation?.geo_long != null
    ) {
      const controls = globeEl.current.controls();
      controls.autoRotate = false;
      globeEl.current.pointOfView(
        {
          lat: currentStation.geo_lat,
          lng: currentStation.geo_long,
          altitude: 1.2,
        },
        1500
      );
    }
  }, [currentStation]);

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
              ) as unknown as GeoJsonFeatureCollection;
              console.log(
                "Fallback features loaded:",
                countries.features.length
              );
              setLandPolygons(countries.features);
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
            play().catch((error) => {
              console.error("Error playing station:", error);
            });
          }, 100);
        } catch (error) {
          console.error("Error selecting/playing station:", error);
        }
      }
    },
    [selectStation, play]
  );

  // Handle point hover
  const handlePointHover = (point: any) => {
    if (!point) {
      setHoveredStation(null);
      return;
    }

    const stationPoint = point as GlobePoint;
    console.log("Point hovered:", stationPoint.station?.name);
    setHoveredStation(stationPoint.station);

    // Get the mouse position from the event
    const mouseEvent = window.event as MouseEvent | undefined;
    if (mouseEvent) {
      setTooltipPosition({
        x: mouseEvent.clientX,
        y: mouseEvent.clientY,
      });
    }
  };

  // Handle polygon hover
  const handlePolygonHover = React.useCallback(
    (polygon: GeoJsonFeature | null) => {
      setHoveredPolygon(polygon);
    },
    []
  );

  // Handle polygon click
  const handlePolygonClick = React.useCallback((polygon: GeoJsonFeature) => {
    if (polygon && globeEl.current) {
      try {
        const [centerLng, centerLat] = d3.geoCentroid(polygon);
        if (isFinite(centerLat) && isFinite(centerLng)) {
          globeEl.current.pointOfView(
            { lat: centerLat, lng: centerLng, altitude: 1.5 },
            1000
          );
        }
      } catch (error) {
        console.error("Error centering on country:", error);
      }
    }
  }, []);

  // Materials
  const globeMaterial = React.useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: "#d4dadc",
        emissiveIntensity: 0.1,
        specular: "#4488ff",
        shininess: 3,
        transparent: true,
        opacity: 1,
      }),
    []
  );

  const landMaterial = React.useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: "#fff",
        emissiveIntensity: 0.2,
        specular: "#64748b",
        shininess: 5,
        side: THREE.FrontSide,
        transparent: true,
        opacity: 1,
      }),
    []
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
  console.log("hover state: ", hoveredStation);
  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-900">
      <Globe
        ref={globeEl}
        width={windowSize.width}
        height={windowSize.height}
        backgroundColor="rgba(0, 0, 0, 0)"
        globeMaterial={globeMaterial}
        showAtmosphere={true}
        atmosphereColor="rgba(99, 102, 241, 0.2)"
        atmosphereAltitude={0.15}
        animateIn={false}
        waitForGlobeReady={true}
        rendererConfig={{
          antialias: false,
          alpha: true,
          stencil: false,
          depth: true,
          powerPreference: "high-performance",
        }}
        // Performance optimizations
        enablePointerInteraction={true}
        showGraticules={false}
        // Polygons (countries) - optimized
        polygonsData={landPolygons}
        polygonCapMaterial={landMaterial}
        polygonSideMaterial={landMaterial}
        polygonAltitude={0.01}
        polygonCapColor="#334155"
        polygonSideColor="#1e293b"
        polygonStrokeColor="rgba(99, 102, 241, 0.7)"
        polygonStrokeWidth={0.3}
        polygonResolution={2} // Lower resolution for better performance
        polygonLabel={(obj: any) => {
          const properties = obj?.properties || {};
          return (
            properties?.NAME_LONG ||
            properties?.NAME ||
            properties?.ABBREV ||
            "Unknown"
          );
        }}
        onPolygonClick={handlePolygonClick}
        onPolygonHover={handlePolygonHover}
        // Country labels - full country names with better visibility
        labelsData={landPolygons}
        labelLat={(d: any) => d3.geoCentroid(d)[1]}
        labelLng={(d: any) => d3.geoCentroid(d)[0]}
        labelText={(d: any) =>
          d.properties?.NAME ||
          d.properties?.NAME_LONG ||
          d.properties?.ADMIN ||
          ""
        }
        labelSize={0.8}
        labelDotRadius={0}
        labelColor={() => "#252525"}
        labelAltitude={0.03}
        labelResolution={2}
        labelIncludeDot={false}
        labelStyle={{
          background: "rgba(0, 0, 0, 0.8)",
          padding: "2px 6px",
          borderRadius: "4px",
          fontSize: "10px",
          cursor: "default",
          textShadow: "0 0 3px rgba(0,0,0)",
          whiteSpace: "nowrap",
        }}
        // Points (radio stations) - optimized
        pointsData={globePointsData}
        pointAltitude={0.025}
        pointRadius={0.2}
        pointMerge={false}
        pointColor={(point: unknown) => {
          const p = point as GlobePoint;
          if (currentStation?.stationuuid === p.station.stationuuid)
            return "#3b82f6";
          if (hoveredStation?.stationuuid === p.station.stationuuid)
            return "#f59e0b";
          return "#ef4444";
        }}
        onPointHover={handlePointHover}
        onPointClick={handlePointClick}
        pointLabel={(point: any) => {
          const station = point?.station;
          if (!station) return "";

          return (
            <div className="rounded-lg w-full bg-zinc-50 text-black flex justify-between items-center p-2">
              <div className="w-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-radio-icon lucide-radio"><path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/></svg>
              </div>
              <div className="flex-1 flex-col gap-1 bg-white text-black p-2">
                <div className="font-bold text-sm">
                  {station.name || "Station"}
                </div>
                <div className="text-xs opacity-9 ">
                  {station.country || ""}
                </div>
                {station.tags ? (
                  <div className="text-xs opacity-70 mt-1">
                    {Array.isArray(station.tags)
                      ? station.tags.slice(0, 3).join(" • ")
                      : String(station.tags).split(",").slice(0, 3).join(" • ")}
                  </div>
                ) : (
                  ""
                )}
              </div>
            </div>
          );
        }}
        pointsMerge={false}
        pointsTransitionDuration={200}
        pointResolution={8}
        pointerEvents={["click", "hover"]}
      />

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
