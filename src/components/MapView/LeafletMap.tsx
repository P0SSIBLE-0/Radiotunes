import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { Station } from '../../types/radio.t.ts';
import HoverTooltip from './HoverTooltip.tsx';
import { useAppStore } from '../../store/index.ts';

import 'leaflet/dist/leaflet.css';
import './MapView.css';

// --- Controls map events (zoom and navigation) ---
const MapController: React.FC<{
  setZoom: (zoom: number) => void;
}> = ({ setZoom }) => {
  const map = useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  const { currentStation, locateStationTrigger } = useAppStore();



  // Effect to fly to the station when it's selected or the locate trigger is fired
  useEffect(() => {
    if (currentStation?.geo_lat != null && currentStation?.geo_long != null) {
      const currentMapZoom = map.getZoom();
      const targetZoom = Math.max(currentMapZoom, 5); 
      map.flyTo([currentStation.geo_lat, currentStation.geo_long], targetZoom, {
        animate: true,
        duration: 1.5,
      });
    }
  // The locateStationTrigger dependency ensures this runs even if the station is the same
  }, [currentStation, locateStationTrigger, map]); 

  return null;
};

// --- High-Performance Canvas Markers using only Leaflet ---
const StationMarkers: React.FC<{
  setHoverInfo: (info: { station: Station; x: number; y: number } | null) => void;
}> = ({ setHoverInfo }) => {
  const map = useMap();
  // Use stationsOnMap for filtering
  const { stationsOnMap, currentStation, selectStation, play ,  isDarkMode} = useAppStore();
  const layerRef = useRef<L.FeatureGroup | null>(null);

  const handleStationClick = useCallback((station: Station) => {
    // We find the index from the filtered list to maintain correct next/prev logic
    const stationIndex = stationsOnMap.findIndex((s: Station) => s.stationuuid === station.stationuuid);
    if (stationIndex !== -1) {
      selectStation(station, stationIndex);
      setTimeout(() => play().catch(console.error), 100);
    }
  }, [stationsOnMap, selectStation, play]);

  // Create the main layer group only once
  useEffect(() => {
    if (!layerRef.current) {
      layerRef.current = L.featureGroup().addTo(map);
    }
  }, [map]);

  // Update markers when stationsOnMap changes
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;

    layer.clearLayers(); // Clear old markers

    stationsOnMap.forEach((station: Station) => {
      if (station.stationuuid === currentStation?.stationuuid || !station.geo_lat || !station.geo_long) {
        return;
      }

      const marker = L.circleMarker([station.geo_lat, station.geo_long], {
        radius: 4,
        fillColor: isDarkMode ? "#FFFFFF" : "#000000",
        fillOpacity: 0.7,
        color: isDarkMode ? "#252525" : "#FFFFFF",
        weight: 1,
        interactive: true,
      });

      marker.on('mouseover', (e) => setHoverInfo({ station, x: e.originalEvent.clientX, y: e.originalEvent.clientY }));
      marker.on('mouseout', () => setHoverInfo(null));
      marker.on('click', () => handleStationClick(station));

      layer.addLayer(marker);
    });
  }, [stationsOnMap, currentStation, map, handleStationClick, setHoverInfo, isDarkMode]);

  return null;
};


// Main Map Component
const LeafletMap: React.FC = () => {
  // Get stationsOnMap as 'stations' for clarity below
  const { isLoadingStations, stationsOnMap: stations, currentStation,isDarkMode } = useAppStore();
  const lightThemeUrl = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  const darkThemeUrl = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  const mapRef = useRef<L.Map>(null);
  const [zoom, setZoom] = useState(3);
  const [hoverInfo, setHoverInfo] = useState<{ station: Station; x: number; y: number } | null>(null);

  useEffect(() => {
    if (mapRef.current) setZoom(mapRef.current.getZoom());
  }, []);

  const activeStationMarker = useMemo(() => {
    if (!currentStation || currentStation.geo_lat == null || currentStation.geo_long == null) return null;
    return (
      <Marker
        position={[currentStation.geo_lat, currentStation.geo_long]}
        icon={L.divIcon({ className: '', html: '<div class="station-marker-active"></div>' })}
        zIndexOffset={1000}
      />
    );
  }, [currentStation]);

  if (isLoadingStations && stations.length === 0) {
    return <div className="w-full h-full flex items-center justify-center bg-gray-100"><p className="text-xl text-slate-500 font-semibold animate-pulse">Loading Map...</p></div>;
  }

  return (
    <div className="relative w-screen h-screen">
      <div className="absolute top-0 left-0 w-full h-full z-10">
        <MapContainer
          ref={mapRef}
          center={[25, 10]}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          minZoom={2}
          maxZoom={12}
          worldCopyJump={true}
          zoomControl={false}
          preferCanvas={true} 
          maxBounds={[[-90, -180], [90, 180]]}
          maxBoundsViscosity={1}
        >
          <TileLayer
            url={isDarkMode ? darkThemeUrl : lightThemeUrl}
          />
          <MapController setZoom={setZoom} />
          <StationMarkers setHoverInfo={setHoverInfo} />
          {activeStationMarker}
        </MapContainer>
      </div>
      <HoverTooltip info={hoverInfo} />
    </div>
  );
};

export default LeafletMap;