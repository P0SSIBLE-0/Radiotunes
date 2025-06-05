import React, { useEffect } from 'react';
import Player from './components/Player';
import SearchStations from './components/SearchStations';
import { useRadioStore } from './store/radioStore';
import './App.css';
const RadioGlobe = React.lazy(() => import('./components/RadioGlobe'));

function App() {
  const fetchAndSetStations = useRadioStore((state) => state.fetchAndSetStations);

  useEffect(() => {
    fetchAndSetStations(true); // Fetch stations and auto-select the first one
  }, [fetchAndSetStations]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-900">
      <React.Suspense fallback={<div>Loading...</div>}>
        <RadioGlobe />
      </React.Suspense>
      <SearchStations />
      {/* <Filters /> */}
      <Player />
    </div>
  );
}

export default App;
