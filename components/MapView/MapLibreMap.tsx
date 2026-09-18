// src/components/MapView/MapLibreMap.tsx
"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type * as GeoJSON from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import { useAppStore } from "@/store";
import type { StationPreview } from "@/types/radio.t";
import HoverTooltip from "./HoverTooltip";
import { Loader2 } from "lucide-react";
import "./MapView.css";

// MapLibre v6 requires bundler users (Next.js/Turbopack) to point at a
// self-hosted worker. The files are copied from node_modules to
// public/maplibre by scripts/copy-maplibre-worker.mjs (predev/prebuild).
maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');

const CARTO_API_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY ?? "";

const cartoTiles = (style: "light_all" | "dark_all") =>
  `https://basemaps.cartocdn.com/${style}/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`;

const MapLibreMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const activeStationMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Granular subscriptions so unrelated store updates (volume, playback, …)
  // don't re-render the map.
  const stationsOnMap = useAppStore((s) => s.stationsOnMap);
  const currentStation = useAppStore((s) => s.currentStation);
  const isDarkMode = useAppStore((s) => s.isDarkMode);
  const isLoadingStations = useAppStore((s) => s.isLoadingStations);
  const locateStationTrigger = useAppStore((s) => s.locateStationTrigger);
  const selectStation = useAppStore((s) => s.selectStation);
  const play = useAppStore((s) => s.play);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<{
    station: StationPreview;
    x: number;
    y: number;
  } | null>(null);

  // Mirror of stationsOnMap for map event handlers, so they can stay
  // registered instead of being torn down on every data update.
  const stationsRef = useRef(stationsOnMap);
  useEffect(() => {
    stationsRef.current = stationsOnMap;
  }, [stationsOnMap]);

  // Memoized GeoJSON features: rebuilt only when the station list changes,
  // not on unrelated re-renders. Properties carry just the fields the map
  // UI needs to keep worker messages small (13k+ stations).
  const stationFeatures: GeoJSON.Feature[] = useMemo(
    () =>
      stationsOnMap
        .filter((s) => s.geo_lat != null && s.geo_long != null)
        .map((s) => ({
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: [Number(s.geo_long), Number(s.geo_lat)],
          },
          properties: {
            stationuuid: s.stationuuid,
            name: s.name,
            country: s.country,
            favicon: s.favicon,
          },
        })),
    [stationsOnMap]
  );

  // Initialize Map
  useEffect(() => {
    if (mapRef.current) return;
    if (!mapContainerRef.current) return;

    if (!CARTO_API_KEY) {
      console.error(
        "MapLibreMap: Missing NEXT_PUBLIC_CARTO_API_KEY. " +
          "Get a free key at https://carto.com/basemaps/apikey and add it to your .env file."
      );
    }

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            "carto-light": {
              type: "raster",
              tiles: [cartoTiles("light_all")],
              tileSize: 256,
            },
            "carto-dark": {
              type: "raster",
              tiles: [cartoTiles("dark_all")],
              tileSize: 256,
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
                "circle-radius": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  4, 4,
                  8, 8
                ],
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

      mapRef.current = map;

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
  }, []);

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

    const source = map.getSource("stations") as maplibregl.GeoJSONSource | undefined;
    source?.setData({
      type: "FeatureCollection",
      features: stationFeatures,
    });
  }, [stationFeatures, mapLoaded]);

  // Handle Interactions (Hover, Click)
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;

    const onMouseEnter = (e: maplibregl.MapLayerMouseEvent) => {
      map.getCanvas().style.cursor = 'pointer';
      if (e.features && e.features.length > 0) {
        const feature = e.features[0];
        const station = feature.properties as unknown as StationPreview;
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
        const station = feature.properties as unknown as StationPreview;

        // Find in store to get consistent object/index
        const stationIndex = stationsRef.current.findIndex(s => s.stationuuid === station.stationuuid);
        const realStation = stationsRef.current[stationIndex];

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
  }, [mapLoaded, selectStation, play]);

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
        speed: 1,
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
      container.style.position = 'relative';

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
