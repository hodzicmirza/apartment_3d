import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const customIcon = new L.DivIcon({
  className: 'custom-icon',
  html: `<div style="background-color: #0f172a; color: white; border-radius: 50%; padding: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 15 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg></div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

export default function LocationMap() {
  return (
    <MapContainer center={[44.133639, 18.123861]} zoom={15} scrollWheelZoom={false} className="w-full h-full z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <Marker position={[44.133639, 18.123861]} icon={customIcon}>
        <Popup>
          <div className="font-bold text-slate-900">Rezidencija Vista</div>
          <div className="text-slate-500">Ovdje počinje vaš novi dom.</div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
