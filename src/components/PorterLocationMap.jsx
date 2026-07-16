import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "./PorterLocationMap.css";

// Vite (like most bundlers) breaks Leaflet's default marker icon path
// resolution — this is the standard fix: point it at the bundled assets directly.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// coordinates: [longitude, latitude], matching the GeoJSON order used everywhere else in this app.
export function PorterLocationMap({ coordinates }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!coordinates || !containerRef.current || mapRef.current) return;

    const [lng, lat] = coordinates;
    const map = L.map(containerRef.current, { zoomControl: true }).setView([lat, lng], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    markerRef.current = L.marker([lat, lng]).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(coordinates)]);

  useEffect(() => {
    if (!coordinates || !mapRef.current || !markerRef.current) return;
    const [lng, lat] = coordinates;
    markerRef.current.setLatLng([lat, lng]);
    mapRef.current.panTo([lat, lng]);
  }, [coordinates]);

  if (!coordinates) {
    return (
      <div className="porter-map porter-map-placeholder">
        Waiting for the porter to start sharing their location...
      </div>
    );
  }

  return <div ref={containerRef} className="porter-map" />;
}
