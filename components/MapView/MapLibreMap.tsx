// src/components/MapView/MapLibreMap.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useAppStore } from "@/store";
import type { Station } from "@/types/radio.t";
import HoverTooltip from "./HoverTooltip";
import { Loader2 } from "lucide-react";
import "./MapView.css";

const MapLibreMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const activeStationMarkerRef = useRef<maplibregl.Marker | null>(null);

  const {
    stationsOnMap,
    currentStation,
    isDarkMode,
    selectStation,
    play,
    isLoadingStations,
    locateStationTrigger,
  } = useAppStore();

  const [mapLoaded, setMapLoaded] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<{
    station: Station;
    x: number;
    y: number;
  } | null>(null);

  // Initialize Map
  useEffect(() => {
    if (mapRef.current) return;
    if (!mapContainerRef.current) return;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            "carto-light": {
              type: "raster",
              tiles: ["https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"],
              tileSize: 256,
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            },
            "carto-dark": {
              type: "raster",
              tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"],
              tileSize: 256,
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            },
            stations: {
              type: "geojson",
              data: {
                type: "FeatureCollection",
                features: [],
              },
            },
          },
          layers: [
            {
              id: "carto-light-layer",
              type: "raster",
              source: "carto-light",
              layout: { visibility: "visible" },
            },
            {
              id: "carto-dark-layer",
              type: "raster",
              source: "carto-dark",
              layout: { visibility: "none" },
            },
            {
              id: "stations-layer",
              type: "circle",
              source: "stations",
              paint: {
                "circle-radius": 5,
                "circle-color": "#000000",
                "circle-stroke-width": 1,
                "circle-stroke-color": "#FFFFFF",
              },
            },
          ],
        },
        center: [10, 25],
        zoom: 2,
        minZoom: 2,
        maxZoom: 18,
        pitchWithRotate: false,
        dragRotate: false,
        touchPitch: false,
        attributionControl: {
          compact: false,
        },
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

      map.on('load', () => {
        mapRef.current = map;
        setMapLoaded(true);
      });

    } catch (e) {
      console.error("MapLibreMap: Error in constructor:", e);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Handle Theme Changes (Basemap toggling and Station Colors)
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    if (isDarkMode) {
      if (map.getLayer("carto-light-layer")) map.setLayoutProperty("carto-light-layer", "visibility", "none");
      if (map.getLayer("carto-dark-layer")) map.setLayoutProperty("carto-dark-layer", "visibility", "visible");

      if (map.getLayer("stations-layer")) {
        map.setPaintProperty("stations-layer", "circle-color", "#FFFFFF");
        map.setPaintProperty("stations-layer", "circle-stroke-color", "#252525");
      }
    } else {
      if (map.getLayer("carto-light-layer")) map.setLayoutProperty("carto-light-layer", "visibility", "visible");
      if (map.getLayer("carto-dark-layer")) map.setLayoutProperty("carto-dark-layer", "visibility", "none");

      if (map.getLayer("stations-layer")) {
        map.setPaintProperty("stations-layer", "circle-color", "#000000");
        map.setPaintProperty("stations-layer", "circle-stroke-color", "#FFFFFF");
      }
    }
  }, [isDarkMode, mapLoaded]);

  // Update Stations Source
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    const source = map.getSource("stations") as maplibregl.GeoJSONSource;
    if (source) {
      const features = stationsOnMap
        .filter((s) => s.geo_lat != null && s.geo_long != null)
        .map((s) => ({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [Number(s.geo_long), Number(s.geo_lat)],
          },
          properties: s as unknown as Record<string, unknown>,
        }));

      source.setData({
        type: "FeatureCollection",
        features: features as unknown as GeoJSON.Feature[],
      });
    }
  }, [stationsOnMap, mapLoaded]);

  // Handle Interactions (Hover, Click)
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    const onMouseEnter = (e: maplibregl.MapLayerMouseEvent) => {
      map.getCanvas().style.cursor = 'pointer';
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const station = feature.properties as unknown as Station;
        setHoverInfo({
          station,
          x: e.point.x,
          y: e.point.y,
        });
      }
    };

    const onMouseLeave = () => {
      map.getCanvas().style.cursor = '';
      setHoverInfo(null);
    };

    const onClick = (e: maplibregl.MapLayerMouseEvent) => {
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const station = feature.properties as unknown as Station;

        // Find in store to get consistent object/index
        const stationIndex = stationsOnMap.findIndex(s => s.stationuuid === station.stationuuid);
        const realStation = stationsOnMap[stationIndex];

        if (realStation) {
          selectStation(realStation, stationIndex);
          setTimeout(() => play().catch(console.error), 100);
        }
      }
    };

    map.on('mouseenter', 'stations-layer', onMouseEnter);
    map.on('mouseleave', 'stations-layer', onMouseLeave);
    map.on('click', 'stations-layer', onClick);

    return () => {
      map.off('mouseenter', 'stations-layer', onMouseEnter);
      map.off('mouseleave', 'stations-layer', onMouseLeave);
      map.off('click', 'stations-layer', onClick);
    };
  }, [mapLoaded, stationsOnMap, selectStation, play]);

  // Handle FlyTo and Active Marker
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    if (currentStation?.geo_lat != null && currentStation?.geo_long != null) {
      const coords: [number, number] = [Number(currentStation.geo_long), Number(currentStation.geo_lat)];

      // FlyTo
      const currentZoom = map.getZoom();
      const targetZoom = Math.max(currentZoom, 5);
      map.flyTo({
        center: coords,
        zoom: targetZoom,
        speed: 1.5,
        essential: true
      });

      // Active Marker
      if (activeStationMarkerRef.current) {
        activeStationMarkerRef.current.remove();
      }

      // DOM Structure for Active Marker:
      // 1. Container (Root): Created by us, passed to MapLibre. 0x0 size, relative.
      //    MapLibre positions this element at the coordinate (transform: translate(...)).
      const container = document.createElement('div');
      container.style.width = '0px';
      container.style.height = '0px';
      container.style.position = 'absolute';

      // 2. Positioner: Absolute, centered within the Container.
      //    We use this to center the marker visually (-50%, -50%).
      //    We do this here instead of in the visual element to avoid conflict with CSS animations (scale).
      const positioner = document.createElement('div');
      positioner.style.position = 'absolute';
      positioner.style.left = '0';
      positioner.style.top = '0';
      positioner.style.transform = 'translate(-50%, -50%)';

      // 3. Visual: The actual visible marker element.
      //    It has the class .station-marker-active (green dot, pulse animation).
      //    The animation uses `transform: scale(...)`, which is why we need the separate positioner.
      const visual = document.createElement('div');
      visual.className = 'station-marker-active';

      positioner.appendChild(visual);
      container.appendChild(positioner);

      activeStationMarkerRef.current = new maplibregl.Marker({
        element: container,
        anchor: 'center' // MapLibre centers the container at the coordinate
      })
      .setLngLat(coords)
      .addTo(map);

    } else {
      if (activeStationMarkerRef.current) {
        activeStationMarkerRef.current.remove();
        activeStationMarkerRef.current = null;
      }
    }

  }, [currentStation, locateStationTrigger, mapLoaded]);

  return (
    <div className="relative w-screen h-screen">
      <div
        ref={mapContainerRef}
        data-testid="map-container"
        className="absolute top-0 left-0 w-full h-full z-10"
      />

      {(isLoadingStations && stationsOnMap.length === 0) && (
         <div className="absolute inset-0 z-50 flex items-center justify-center dark:bg-zinc-900 bg-gray-50 dark:text-neutral-400 text-neutral-500">
           <Loader2 className="animate-spin mr-2" size={20} />
           <p className="text-lg font-semibold leading-1.5">Loading...</p>
         </div>
      )}

      <HoverTooltip info={hoverInfo} />
    </div>
  );
};

export default MapLibreMap;
