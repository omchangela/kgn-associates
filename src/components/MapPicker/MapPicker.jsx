'use client';
import { useEffect, useRef } from 'react';

/**
 * MapPicker — interactive Leaflet map for selecting GPS coordinates.
 * Loaded via dynamic(..., { ssr: false }) to avoid Next.js SSR issues.
 *
 * Fix: React StrictMode mounts → unmounts → remounts in dev, leaving a stale
 * _leaflet_id on the DOM node. We clear it before each init so Leaflet
 * never throws "Map container is already initialized."
 */
export default function MapPicker({ lat, lng, onChange }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markerRef    = useRef(null);

  const parsedLat = parseFloat(lat) || 17.385;   // default: Hyderabad
  const parsedLng = parseFloat(lng) || 78.4867;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Dynamically import leaflet CSS once
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id   = 'leaflet-css';
      link.rel  = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    let cancelled = false; // guard against StrictMode unmount before async resolves

    import('leaflet').then((L) => {
      if (cancelled) return;
      if (!containerRef.current) return;

      const Leaflet = L.default || L;

      // ── StrictMode fix: clear stale Leaflet instance on the DOM node ──────
      if (containerRef.current._leaflet_id) {
        // If a previous map instance exists on the ref, remove it properly
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current   = null;
          markerRef.current = null;
        }
        // Leaflet sets _leaflet_id on the container div; reset it so a fresh
        // map can be created without the "already initialized" error.
        delete containerRef.current._leaflet_id;
      }

      if (mapRef.current) return; // already initialised (should not happen, but guard)

      // Fix default marker icon path broken by webpack bundling
      delete Leaflet.Icon.Default.prototype._getIconUrl;
      Leaflet.Icon.Default.mergeOptions({
        iconUrl:        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl:  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:      'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = Leaflet.map(containerRef.current, {
        center:      [parsedLat, parsedLng],
        zoom:        15,
        zoomControl: true,
      });

      Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const marker = Leaflet.marker([parsedLat, parsedLng], { draggable: true }).addTo(map);
      marker.bindPopup('Drag the pin or click the map to set location').openPopup();

      marker.on('dragend', () => {
        const { lat: mLat, lng: mLng } = marker.getLatLng();
        onChange(mLat.toFixed(6), mLng.toFixed(6));
      });

      map.on('click', (e) => {
        const { lat: cLat, lng: cLng } = e.latlng;
        marker.setLatLng([cLat, cLng]);
        onChange(cLat.toFixed(6), cLng.toFixed(6));
      });

      mapRef.current    = map;
      markerRef.current = marker;
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current    = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync marker + pan when lat/lng props change externally (e.g. GPS button)
  useEffect(() => {
    if (!markerRef.current || !mapRef.current) return;
    const newLat = parseFloat(lat);
    const newLng = parseFloat(lng);
    if (!isNaN(newLat) && !isNaN(newLng)) {
      markerRef.current.setLatLng([newLat, newLng]);
      mapRef.current.panTo([newLat, newLng]);
    }
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      style={{
        width:        '100%',
        height:       '340px',
        borderRadius: '10px',
        border:       '1px solid rgba(184,134,11,0.3)',
        overflow:     'hidden',
        marginTop:    '12px',
        zIndex:       0,
      }}
    />
  );
}
