import { useEffect } from 'react';
import Player from './components/Player';
import SearchStations from './components/SearchStations';
import { useAppStore } from './store/index';
import './App.css';
import LeafletMap from './components/MapView/LeafletMap';
import LoadingCounter from './components/LoadingCounter';

function App() {
  const { fetchAndSetStations, isDarkMode , setInitialStationId,currentStation} = useAppStore();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stationIdFromUrl = urlParams.get('station');
    if (stationIdFromUrl) {
      console.log(`Found station ID in URL: ${stationIdFromUrl}`);
      setInitialStationId(stationIdFromUrl);
      // Optional: Clean the URL after reading the parameter
      // window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [setInitialStationId]);

  useEffect(() => {
    fetchAndSetStations(true); // Fetch stations and auto-select the first one
  }, [fetchAndSetStations]);

  useEffect(() => {
    if (currentStation?.name) {
      document.title = `${currentStation.name} - Radiotunes`;
    } else {
      document.title = 'Radiotunes - Listen to Radio Stations Worldwide';
    }
  }, [currentStation]);

  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark');
      window.localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      window.localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);


  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-100">
      <LeafletMap />
      <LoadingCounter />
      <SearchStations />
      {/* <Filters /> */}
      <Player />
    </div>
  );
}

export default App;