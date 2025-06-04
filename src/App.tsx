import { useEffect } from 'react'; // Removed unused React import
import RadioGlobe from './components/RadioGlobe';
import Player from './components/Player';
import SearchStations from './components/SearchStations';
import Filters from './components/Filters';
import { useRadioStore } from './store/radioStore'; // Added useRadioStore import
import './App.css';

function App() {
  const fetchAndSetStations = useRadioStore((state) => state.fetchAndSetStations);

  useEffect(() => {
    fetchAndSetStations(true); // Fetch stations and auto-select the first one
  }, [fetchAndSetStations]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-900">
      <RadioGlobe />
      <SearchStations />
      {/* <Filters /> */}
      <Player />
    </div>
  );
}

export default App;
