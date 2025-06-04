import React, { useEffect, useMemo, useRef, useCallback } from "react";
import * as d3 from "d3-geo";
import Globe, { type GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import { type Station } from "../services/radioApi";

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
  currentStation: Station | null;
  setHoveredPolygon: (polygon: GeoJsonFeature | null) => void;
  children: React.ReactNode;
}

const GlobeRenderer: React.FC<GlobeRendererProps> = ({
  landPolygons,
  currentStation,
  setHoveredPolygon,
  children,
}) => {
  const globeEl = useRef<GlobeMethods | undefined>(undefined);

  const globeMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#d4dadc",
        transparent: false,
        opacity: 1,
      }),
    []
  );

  const landMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#f8fafc",
        transparent: true,
        opacity: 0.8,
        side: THREE.FrontSide,
        wireframe: false,
      }),
    []
  );

  const countryStyles = () => ({
    borderColor: "#1E90FF", // Changed border color to blue (DodgerBlue)
    fillColor: "#252525",
    hoverColor: "#e2e8f0",
    strokeWidth: 1.5, // Slightly thicker stroke for visibility
    stroke: true,
  });

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.2;
      globeEl.current.controls().enableZoom = true;
      globeEl.current.pointOfView({ altitude: 3.5 }, 0);
    }
  }, []);

  useEffect(() => {
    if (
      globeEl.current &&
      currentStation?.geo_lat &&
      currentStation?.geo_long
    ) {
      globeEl.current.pointOfView(
        {
          lat: currentStation.geo_lat,
          lng: currentStation.geo_long,
          altitude: 0.5,
        },
        1500
      );
      globeEl.current.controls().autoRotate = false;
    }
  }, [currentStation]);

  const handlePolygonHover = useCallback(
    (polygon: any) => {
      setHoveredPolygon(polygon || null);
      if (globeEl.current) {
        const scene = globeEl.current.scene();
        if (scene) {
          scene.traverse((obj: any) => {
            if (obj.type === "Mesh" && obj.userData?.type === "polygons") {
              obj.material.color.setStyle(
                polygon ? countryStyles().hoverColor : countryStyles().fillColor
              );
            }
          });
        }
      }
    },
    [setHoveredPolygon]
  );

  return (
    <Globe
      ref={globeEl}
      backgroundColor="#eee"
      globeMaterial={globeMaterial}
      polygonsData={landPolygons}
      polygonCapMaterial={landMaterial}
      polygonSideMaterial={landMaterial}
      hoverPolygonMaterial={landMaterial}
      
      polygonAltitude={0.01}
      polygonCapAltitude={0.01}
      polygonSideAltitude={0.01}
      polygonCapColor={countryStyles().fillColor}
      polygonSideColor="#f1f5f9"
      polygonStrokeColor={countryStyles().borderColor} // Apply border color
      polygonLabel={(obj: any) => {
        const properties = obj?.properties || {};
        return (
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)', // Semi-transparent black background
            color: '#252525', // White text for contrast
            padding: '6px 10px',
            borderRadius: '6px',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            fontWeight: 'bold',
            border: `1px solid ${countryStyles().borderColor}`, // Match border color
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            pointerEvents: 'none',
            transform: 'translate(-50%, -50%)', // Center label
          }}>
            {properties?.NAME_LONG || properties?.ABBREV || "Unknown"}
          </div>
        );
      }}
      onPolygonHover={handlePolygonHover}
      onPolygonClick={(polygon: any) => {
        if (polygon && globeEl.current) {
          try {
            const [centerLng, centerLat] = d3.geoCentroid(polygon);
            globeEl.current.pointOfView(
              { lat: centerLat, lng: centerLng, altitude: 1.5 },
              1000
            );
          } catch (error) {
            console.error("Error centering on country:", error);
          }
        }
      }}
      showAtmosphere={false}
      showGraticules={true}
      labelsData={landPolygons} // Add labelsData to render country names
      labelLat={(d: any) => d3.geoCentroid(d)[1]} // Latitude from centroid
      labelLng={(d: any) => d3.geoCentroid(d)[0]} // Longitude from centroid
      labelText={(d: any) => d.properties?.NAME_LONG || d.properties?.ABBREV || "Unknown"} // Country name
      labelSize={() => 0.5} // Consistent label size
      labelDotRadius={() => 0} // Remove dot under label
      labelColor={() => "#252525"} // White text for labels
      labelLabel={(d: any) => d.properties?.NAME_LONG || d.properties?.ABBREV || "Unknown"}
    >
      {children}
    </Globe>
  );
};

export default GlobeRenderer;