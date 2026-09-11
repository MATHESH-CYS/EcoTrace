"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, LocateFixed, Search } from "lucide-react";
import { loadGoogleMaps } from "@/lib/maps/loadGoogleMaps";

type LatLng = { lat: number; lng: number };

type Props = {
  onLocationChange: (loc: LatLng, formatted?: string) => void;
  initial?: LatLng;
};

const DEFAULT_CENTER: LatLng = { lat: 12.9716, lng: 77.5946 }; // Bengaluru fallback

export function AddressMapPicker({ onLocationChange, initial }: Props) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [locating, setLocating] = useState(false);
  const [pickedLabel, setPickedLabel] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapDivRef.current) return;
        const google = (window as any).google;
        const center = initial ?? DEFAULT_CENTER;

        const map = new google.maps.Map(mapDivRef.current, {
          center,
          zoom: 15,
          mapId: "ECOTRACE_PICKUP_MAP",
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
        });
        mapRef.current = map;
        geocoderRef.current = new google.maps.Geocoder();

        const marker = new google.maps.marker.AdvancedMarkerElement
          ? new google.maps.marker.AdvancedMarkerElement({ map, position: center, gmpDraggable: true })
          : new google.maps.Marker({ map, position: center, draggable: true });
        markerRef.current = marker;

        function reverseGeocode(loc: LatLng) {
          geocoderRef.current.geocode({ location: loc }, (results: any[], geoStatus: string) => {
            if (geoStatus === "OK" && results?.[0]) {
              setPickedLabel(results[0].formatted_address);
              onLocationChange(loc, results[0].formatted_address);
            } else {
              onLocationChange(loc);
            }
          });
        }

        function moveMarkerTo(loc: LatLng) {
          if (marker.position !== undefined) {
            marker.position = loc;
          } else {
            marker.setPosition(loc);
          }
          map.panTo(loc);
          reverseGeocode(loc);
        }

        map.addListener("click", (e: any) => {
          const loc = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          moveMarkerTo(loc);
        });

        if (marker.addListener) {
          marker.addListener("dragend", () => {
            const pos = marker.getPosition();
            moveMarkerTo({ lat: pos.lat(), lng: pos.lng() });
          });
        } else {
          marker.addEventListener("dragend", () => {
            const pos = marker.position;
            moveMarkerTo({ lat: pos.lat, lng: pos.lng });
          });
        }

        // Places autocomplete on the search box
        if (searchInputRef.current && google.maps.places) {
          const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
            fields: ["geometry", "formatted_address"],
          });
          autocomplete.bindTo("bounds", map);
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry?.location) return;
            const loc = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
            map.setZoom(17);
            moveMarkerTo(loc);
            if (place.formatted_address) setPickedLabel(place.formatted_address);
          });
        }

        if (initial) {
          reverseGeocode(initial);
        }

        setStatus("ready");
      })
      .catch((err) => {
        console.error("AddressMapPicker failed to initialize:", err);
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocating(false);
        if (mapRef.current && markerRef.current) {
          const google = (window as any).google;
          mapRef.current.setZoom(17);
          mapRef.current.panTo(loc);
          if (markerRef.current.position !== undefined) {
            markerRef.current.position = loc;
          } else {
            markerRef.current.setPosition(loc);
          }
          geocoderRef.current?.geocode({ location: loc }, (results: any[], geoStatus: string) => {
            if (geoStatus === "OK" && results?.[0]) {
              setPickedLabel(results[0].formatted_address);
              onLocationChange(loc, results[0].formatted_address);
            } else {
              onLocationChange(loc);
            }
          });
          void google;
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  if (status === "error") {
    return (
      <div className="card" style={{ padding: 16, textAlign: "center" }}>
        <p className="text-secondary text-footnote">
          Map could not load. You can still fill the address fields manually below.
        </p>
      </div>
    );
  }

  return (
    <div className="stack gap-2">
      <div className="row gap-2" style={{ position: "relative" }}>
        <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search for your address, landmark or area"
          className="input"
          style={{ paddingLeft: 36, flex: 1 }}
          disabled={status !== "ready"}
        />
      </div>

      <div style={{ position: "relative" }}>
        <div
          ref={mapDivRef}
          style={{
            width: "100%",
            height: 220,
            borderRadius: 12,
            overflow: "hidden",
            background: "var(--bg-secondary, #eee)",
          }}
        />
        {status === "loading" && (
          <div
            className="row"
            style={{
              position: "absolute",
              inset: 0,
              alignItems: "center",
              justifyContent: "center",
              background: "var(--bg-secondary, #eee)",
              borderRadius: 12,
            }}
          >
            <span className="text-footnote text-secondary">Loading map…</span>
          </div>
        )}
        <button
          type="button"
          onClick={useMyLocation}
          disabled={status !== "ready" || locating}
          className="btn btn-outline btn-sm"
          style={{
            position: "absolute",
            right: 10,
            bottom: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "var(--bg-primary, #fff)",
          }}
        >
          <LocateFixed size={14} />
          {locating ? "Locating…" : "Use my location"}
        </button>
      </div>

      {pickedLabel && (
        <div className="row gap-2" style={{ alignItems: "flex-start" }}>
          <MapPin size={14} className="text-accent" style={{ marginTop: 3, flexShrink: 0 }} />
          <span className="text-footnote text-secondary">{pickedLabel}</span>
        </div>
      )}
      <span className="text-footnote text-secondary">
        Tap the map or drag the pin to set the exact pickup point.
      </span>
    </div>
  );
}
