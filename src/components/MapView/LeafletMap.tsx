// src/components/MapView/LeafletMap.tsx

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import * as PIXI from 'pixi.js';
import 'leaflet-pixi-overlay';
import { useRadioStore } from '../../store/radioStore.ts';
import type { Station } from '../../types/radio.t.ts';
import HoverTooltip from './HoverTooltip.tsx';

import 'leaflet/dist/leaflet.css';
import './MapView.css';

const ZOOM_THRESHOLD = 4;

// --- Component 1: Controls map events (zoom and navigation) ---
const MapController: React.FC<{
  setZoom: (zoom: number) => void;
  currentStation: Station | null;
}> = ({ setZoom, currentStation }) => {
  const map = useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  useEffect(() => {
    if (currentStation?.geo_lat != null && currentStation?.geo_long != null) {
      const currentMapZoom = map.getZoom();
      map.flyTo([currentStation.geo_lat, currentStation.geo_long], currentMapZoom < ZOOM_THRESHOLD ? ZOOM_THRESHOLD : currentMapZoom, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [currentStation, map]);

  return null;
};

// --- Component 2: The FINAL, STABLE, AND CORRECT PixiJS points layer ---
const PixiPointsLayer = () => {
  const map = useMap();
  const { stations, currentStation } = useRadioStore();
  const overlayRef = useRef<any>(null);

  // Use refs to hold the latest data. This is crucial to avoid stale closures.
  const stationsRef = useRef(stations);
  const currentStationRef = useRef(currentStation);

  // Keep the refs updated whenever the state changes.
  useEffect(() => {
    stationsRef.current = stations;
    currentStationRef.current = currentStation;
    // When data changes, manually trigger a redraw of the layer.
    if (overlayRef.current) {
      overlayRef.current.redraw();
    }
  }, [stations, currentStation]);

  // This effect runs only ONCE to set up the PIXI layer.
  useEffect(() => {
    if (!map) return;

    const pixiContainer = new PIXI.Container();
    const graphics = new PIXI.Graphics();
    pixiContainer.addChild(graphics);

    const drawCallback = (utils: any) => {
      // Always get the latest data from the refs inside the draw loop.
      const currentStations = stationsRef.current;
      const activeStation = currentStationRef.current;

      graphics.clear(); // Clear previous frame

      const pointsToRender = currentStations.filter(
        s => s.stationuuid !== activeStation?.stationuuid && s.geo_lat != null && s.geo_long != null
      );
      
      const zoom = utils.getMap().getZoom();
      const pointSize = Math.max(2.5, (zoom / ZOOM_THRESHOLD) * 3);

      graphics.beginFill(0x2c3e50, 0.9);

      pointsToRender.forEach(point => {
        const { x, y } = utils.latLngToLayerPoint([point.geo_lat!, point.geo_long!]);
        graphics.drawCircle(x, y, pointSize);
      });

      graphics.endFill();
      utils.getRenderer().render(pixiContainer);
    };

    const pixiOverlay = (L as any).pixiOverlay(drawCallback, pixiContainer);
    pixiOverlay.addTo(map);
    overlayRef.current = pixiOverlay; // Store the layer instance in a ref

    return () => {
      map.removeLayer(pixiOverlay);
    };
  }, [map]); // This effect should only run once when the map is ready.

  return null;
};

// --- Component 3: Interactive Markers (Unchanged) ---
const InteractiveMarkers: React.FC<{
  setHoverInfo: (info: { station: Station; x: number; y: number } | null) => void;
}> = ({ setHoverInfo }) => {
  const { stations, currentStation, selectStation, play } = useRadioStore();

  const handleMarkerClick = (station: Station) => {
    const stationIndex = stations.findIndex(s => s.stationuuid === station.stationuuid);
    if (stationIndex !== -1) {
      selectStation(station, stationIndex);
      setTimeout(() => play().catch(console.error), 100);
    }
  };

  return (
    <>
      {stations
        .filter(s => s.stationuuid !== currentStation?.stationuuid && s.geo_lat != null && s.geo_long != null)
        .map((station) => (
          <Marker
            key={station.stationuuid}
            position={[station.geo_lat!, station.geo_long!]}
            icon={L.divIcon({ className: 'station-marker-wrapper', html: '<div class="station-marker-inner"></div>' })}
            eventHandlers={{
              click: () => handleMarkerClick(station),
              mouseover: (e) => {
                setHoverInfo({ station, x: e.originalEvent.clientX, y: e.originalEvent.clientY });
              },
              mouseout: () => {
                setHoverInfo(null);
              },
            }}
          />
        ))}
    </>
  );
};
const LeafletMap: React.FC = () => {
  const { isLoadingStations, stations, currentStation } = useRadioStore();
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
          minZoom={3}
          maxZoom={13}
          worldCopyJump={true}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />
          <MapController setZoom={setZoom} currentStation={currentStation} />
          <PixiPointsLayer />
          <InteractiveMarkers setHoverInfo={setHoverInfo} />
          {activeStationMarker}
        </MapContainer>
      </div>
      <HoverTooltip info={hoverInfo} />
    </div>
  );
};

export default LeafletMap;