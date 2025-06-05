import React, { useEffect, useMemo, useRef, useCallback } from "react";
import * as d3 from "d3-geo";
import Globe, { type GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import { motion } from "motion/react";
import { debounce } from "../utils/debounce";
import type { StationResponse } from "radio-browser-api";

// Define types
interface FeatureProperties {
  [key: string]: any;
}

interface GeoJsonFeature {
  type: string;
  properties: FeatureProperties;
  geometry: {
    type: string;
    coordinates: any;
  };
}

interface GlobeRendererProps {
  landPolygons: GeoJsonFeature[];
  currentStation: StationResponse | null;
  setHoveredPolygon: (polygon: GeoJsonFeature | null) => void;
  onPointClick: (point: any) => void;
  onPointHover: (point: any, event?: MouseEvent) => void;
  pointsData: any[];
  windowSize: { width: number; height: number };
  children?: React.ReactNode;
}

const GlobeRenderer: React.FC<GlobeRendererProps> = React.memo(
  ({
    landPolygons,
    currentStation,
    setHoveredPolygon,
    onPointClick,
    onPointHover,
    pointsData,
    windowSize,
    children,
  }) => {
    const globeEl = useRef<GlobeMethods | undefined>(undefined);
    const globeMaterial = useMemo(
      () =>
        new THREE.MeshPhongMaterial({
          color: "#d4dadc",
          emissiveIntensity: 0.2,
          shininess: 3,
          transparent: true,
          side: THREE.FrontSide,
          opacity: 1,
        }),
      []
    );
    // Add debounce to hover handler
    const debouncedHover = useCallback(
      debounce((point: any, event?: MouseEvent) => {
        onPointHover?.(point, event);
      }, 50),
      [onPointHover]
    );

    const getPolygonLabel = useCallback((obj: any) => {
      const properties = obj?.properties || {};
      return (
        properties?.NAME_LONG ||
        properties?.NAME ||
        properties?.ABBREV ||
        "Unknown"
      );
    }, []);

    const landMaterial = useMemo(
      () =>
        new THREE.MeshPhongMaterial({
          color: "#fff",
          emissiveIntensity: 0.2,
          specular: "#64748b",
          shininess: 5,
          side: THREE.FrontSide,
          transparent: true,
          opacity: 0.9,
        }),
      []
    );
    // Add auto-rotation
    useEffect(() => {
      const globe = globeEl.current;
      if (!globe) return;
    
      const controls = globe.controls();
    
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.01; // Slower, smooth rotation
        controls.enableDamping = true;  // Adds easing to rotation
        controls.dampingFactor = 0.1;
      }
    
      // Optional: animate controls in a render loop if damping is used
      function animate() {
        requestAnimationFrame(animate);
        controls.update(); // Needed for damping to take effect
      }
      animate();
    
      return () => {
        if (controls) {
          controls.autoRotate = false;
          controls.enableDamping = false;
        }
      };
    }, []);
    

    // Initialize globe settings
    useEffect(() => {
      if (globeEl.current) {
        const controls = globeEl.current.controls();
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.01;
        controls.enableZoom = true;
        controls.enablePan = true;
        controls.enableRotate = true;
        controls.minDistance = 101;
        controls.maxDistance = 1000;
        globeEl.current.pointOfView({ altitude: 2 }, 0);
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
            altitude: 2,
          },
          1500
        );
      }
    }, [currentStation]);

    const handlePolygonHover = useCallback(
      (polygon: any) => {
        setHoveredPolygon(polygon || null);
      },
      [setHoveredPolygon]
    );

    const handlePolygonClick = useCallback((polygon: any) => {
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
    const countryLabelsData = React.useMemo(() => {
      return landPolygons
        .filter((feature) => {
          const props = feature.properties || {};
          return props.NAME || props.NAME_LONG || props.ADMIN;
        })
        .map((feature: any) => {
          const props = feature.properties || {};
          const [lng, lat] = d3.geoCentroid(feature);
          return {
            lat,
            lng,
            name: props.NAME || props.NAME_LONG || props.ADMIN,
            ...feature,
          };
        });
    }, [landPolygons]);

    // Point color
    const pointColor = useCallback(
      (point: any) => {
        if (!point) return "#ef4444";
        if (currentStation?.stationuuid === point.station?.stationuuid)
          return "#3b82f6";
        if (point.hovered) return "#f59e0b";
        return "#ef4444";
      },
      [currentStation?.stationuuid]
    );

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: 1,
          transition: { duration: 0.5 },
        }}
        style={{ width: "100%", height: "100%" }}
      >
        <div
          onMouseMove={(e) => {
            // Store the last mouse position
            if (onPointHover) {
              onPointHover(null, e.nativeEvent);
            }
          }}
        >
          <Globe
            ref={globeEl}
            width={windowSize.width}
            height={windowSize.height}
            backgroundColor="rgba(255, 255, 255, 0.4)"
            globeMaterial={globeMaterial}
            showAtmosphere={false}
            animateIn={false}
            waitForGlobeReady={false}
            rendererConfig={{
              antialias: false,
              alpha: true,
              stencil: false,
              depth: true,
              powerPreference: "high-performance",
              preserveDrawingBuffer: false,
            }}
            pointOfView={{
              lat: currentStation?.geo_lat,
              lng: currentStation?.geo_long,
              altitude: 2,
            }}
            lineHoverPrecision={1}
            enablePointerInteraction={true}
            showGraticules={false}
            // Polygons (countries)
            polygonsData={landPolygons}
            polygonCapMaterial={landMaterial}
            polygonSideMaterial={landMaterial}
            polygonAltitude={0.002}
            polygonCapColor="#334155"
            polygonSideColor="#1e293b"
            polygonStrokeColor="rgba(255, 255, 255, 0.5)"
            polygonStrokeWidth={1.5}
            polygonResolution={3}
            polygonLabel={getPolygonLabel}
            onPolygonClick={handlePolygonClick}
            onPolygonHover={handlePolygonHover}
            // Country labels
            labelSize={0.8}
            labelResolution={2}
            labelsData={countryLabelsData}
            labelLat={(d: any) => d3.geoCentroid(d)[1]}
            labelLng={(d: any) => d3.geoCentroid(d)[0]}
            labelText={(d: any) =>
              d.properties?.NAME ||
              d.properties?.NAME_LONG ||
              d.properties?.ADMIN ||
              ""
            }
            labelDotRadius={0}
            labelColor={() => "#252525"}
            labelAltitude={0.0025}
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
            // Points (radio stations)
            pointsData={pointsData}
            pointAltitude={0.0025}
            pointRadius={0.3}
            pointsMerge={false}
            pointColor={pointColor}
            onPointHover={debouncedHover}
            onPointClick={onPointClick}
            pointsTransitionDuration={300}
            pointResolution={5}
            pointerEvents={["click", "hover"]}
          >
            {children}
          </Globe>
        </div>
      </motion.div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.currentStation?.stationuuid ===
        nextProps.currentStation?.stationuuid &&
      prevProps.pointsData === nextProps.pointsData &&
      prevProps.windowSize.width === nextProps.windowSize.width &&
      prevProps.windowSize.height === nextProps.windowSize.height &&
      prevProps.landPolygons === nextProps.landPolygons
    );
  }
);

export default GlobeRenderer;
