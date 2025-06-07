import { useEffect } from 'react';
import Player from './components/Player';
import SearchStations from './components/SearchStations';
import { useRadioStore } from './store/radioStore';
import './App.css';
import LeafletMap from './components/MapView/LeafletMap';

function App() {
  const fetchAndSetStations = useRadioStore((state) => state.fetchAndSetStations);

  useEffect(() => {
    fetchAndSetStations(true); // Fetch stations and auto-select the first one
  }, [fetchAndSetStations]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-100">
      <LeafletMap />
      <SearchStations />
      {/* <Filters /> */}
      <Player />
    </div>
  );
}

export default App;