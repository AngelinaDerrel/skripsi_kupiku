import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default icon paths for bundlers (Vite)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function FitBounds({ points = [], geojson = null }) {
  const map = useMap();
  useEffect(() => {
    const latlngs = [];
    if (geojson && geojson.type === 'FeatureCollection') {
      geojson.features.forEach(f => {
        const c = f.geometry?.coordinates;
        if (c && c.length >= 2) latlngs.push([c[1], c[0]]);
      });
    }
    if (points && points.length) {
      points.forEach(p => {
        const lat = parseFloat(p.latitude ?? p.lat ?? p.Latitude);
        const lng = parseFloat(p.longitude ?? p.lng ?? p.Longitude ?? p.longtitude);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) latlngs.push([lat, lng]);
      });
    }
    if (latlngs.length === 0) return;
    try { map.fitBounds(latlngs, { padding: [40, 40] }); } catch (e) {}
  }, [map, points, geojson]);
  return null;
}

function normalizeKeys(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  Object.keys(obj).forEach(k => out[k.toLowerCase()] = obj[k]);
  return out;
}

function getTitleFrom(obj) {
  if (!obj) return null;
  if (obj.data && (Array.isArray(obj.data) || typeof obj.data === 'object')) return getTitleFrom(obj.data);
  if (obj.attributes) return getTitleFrom(obj.attributes);
  if (obj.properties) return getTitleFrom(obj.properties);
  const norm = normalizeKeys(obj);
  const candidates = ['nama_location', 'nama_loc', 'nama', 'name', 'title', 'lokasi', 'location', 'label', 'alamat', 'address'];
  for (const c of candidates) {
    if (norm[c] !== undefined && norm[c] !== null) {
      const s = String(norm[c]).trim();
      if (s && s.toLowerCase() !== 'null' && s.toLowerCase() !== 'undefined') return s;
    }
  }
  for (const k of Object.keys(norm)) {
    if (k.includes('nama') || k.includes('name') || k.includes('title')) {
      const s = String(norm[k]).trim();
      if (s && s.toLowerCase() !== 'null' && s.toLowerCase() !== 'undefined') return s;
    }
  }
  return null;
}

export default function Map({ endpoint = '/api/locations/geojson', height = 320 }) {
  const [locations, setLocations] = useState([]);
  const [geojson, setGeojson] = useState(null);
  const [center, setCenter] = useState([-7.797068, 110.370529]);

  useEffect(() => {
    let mounted = true;
    fetch(endpoint)
      .then(r => r.json())
      .then(data => {
        if (!mounted) return;
        // unwrap common wrapper
        const payload = data && data.data ? data.data : data;
        // geojson
        if (payload && payload.type === 'FeatureCollection') {
          setGeojson(payload);
          if (payload.features && payload.features.length) {
            const f = payload.features[0];
            const c = f.geometry?.coordinates;
            if (c && c.length >= 2) setCenter([c[1], c[0]]);
          }
          setLocations([]);
          return;
        }
        // array
        if (Array.isArray(payload)) {
          setLocations(payload);
          if (payload.length) {
            const first = payload[0];
            const lat = parseFloat(first.latitude ?? first.lat ?? first.Latitude);
            const lng = parseFloat(first.longitude ?? first.lng ?? first.Longitude ?? first.longtitude);
            if (!Number.isNaN(lat) && !Number.isNaN(lng)) setCenter([lat, lng]);
          }
          return;
        }
        // single object fallback
        if (payload && typeof payload === 'object') {
          // maybe has data array
          if (Array.isArray(payload.data)) {
            setLocations(payload.data);
            return;
          }
        }
      })
      .catch(err => console.error('Map fetch error', err));
    return () => { mounted = false; };
  }, [endpoint]);

  return (
    <div style={{ width: '100%', height }}>
      <MapContainer center={center} zoom={13} style={{ width: '100%', height: '100%' }} scrollWheelZoom={false}>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {geojson && (
          <GeoJSON data={geojson} onEachFeature={(feature, layer) => {
            const props = feature.properties || {};
            const title = getTitleFrom(props) || 'Location';
            const body = props.address || props.alamat || '';
            layer.bindPopup(`<div style="font-weight:600">${title}</div>${body}`);
            try { layer.bindTooltip(String(title), { permanent: false, direction: 'top', offset: [0, -10], className: 'kp-pin-label' }); } catch (e) {}
          }} />
        )}

        {locations.map(loc => {
          const lat = parseFloat(loc.latitude ?? loc.lat ?? loc.Latitude);
          const lng = parseFloat(loc.longitude ?? loc.lng ?? loc.Longitude ?? loc.longtitude);
          if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
          const key = loc.id_location ?? loc.id ?? `${lat}-${lng}`;
          const title = getTitleFrom(loc) || 'Location';
          return (
            <Marker key={key} position={[lat, lng]}>
              <Tooltip permanent={false} direction="top" offset={[0, -10]} className="kp-pin-label">{title}</Tooltip>
              <Popup><div style={{ fontWeight: 600 }}>{title}</div>{loc.address ?? null}</Popup>
            </Marker>
          );
        })}

        <FitBounds points={locations} geojson={geojson} />
      </MapContainer>
    </div>
  );
}
