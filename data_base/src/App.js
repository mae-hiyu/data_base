import logo from './logo.svg';
import SideMenu from './component/SideMenu';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import MapComponent from './component/MapComponent';
import MapMarker from './component/MapMarker';
import MapComp from "./component/MapComp";
import {useState, createContext, useContext} from "react";

const SideMenuContext = createContext();

function App() {
  const position = [51.505, -0.09];
  const [selectedItem, setSelectedItem] = useState(null);
  
  return (
    <div className="App">
      <div className="app-container">
        <div className="map-container">
          {/* <MapContainer center={position} zoom={3} scrollWheelZoom={false}>
            <TileLayer 
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png">
            </TileLayer>
          </MapContainer> */}
          <SideMenuProvider value={{ selectedItem, setSelectedItem }}>
            {/* <MapComponent/> */}
            <MapComp />
            <div className="nav-container">
              <SideMenu/>
            </div>
          </SideMenuProvider>
        </div>
      </div>
    </div>
  );
}

export function SideMenuProvider({ children }) {
  const [selectedItem, setSelectedItem] = useState(null);
  return (
      <SideMenuContext.Provider value={[selectedItem, setSelectedItem]}>
          {children}
      </SideMenuContext.Provider>
  );
}


export function useSideMenu() {
  return useContext(SideMenuContext)
}

export default App;
