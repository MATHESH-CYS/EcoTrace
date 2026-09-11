declare global {
  interface Window {
    google?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}

let installed = false;

// Google's official inline bootstrap loader (unminified), adapted from
// https://developers.google.com/maps/documentation/javascript/load-maps-js-api
// It installs `google.maps.importLibrary`, which injects the real API
// script on first call and resolves only once the requested library
// (e.g. "maps", "marker", "places") is actually registered and usable —
// unlike a plain <script onload>, which with `loading=async` fires before
// Google's internal library bootstrap has finished.
function installLoader(apiKey: string) {
  if (installed) return;
  installed = true;

  ((g: any) => {
    let h: any,
      a: any,
      k: string,
      p = "The Google Maps JavaScript API",
      c = "google",
      l = "importLibrary",
      q = "__ib__",
      m = document,
      b: any = window;
    b = b[c] || (b[c] = {});
    const d = b.maps || (b.maps = {});
    const r = new Set();
    const e = new URLSearchParams();
    const u = () =>
      h ||
      (h = new Promise((f, n) => {
        a = m.createElement("script");
        e.set("libraries", [...r] + "");
        for (k in g) e.set(k.replace(/[A-Z]/g, (t: string) => "_" + t[0].toLowerCase()), g[k]);
        e.set("callback", c + ".maps." + q);
        a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
        d[q] = f;
        a.onerror = () => (h = n(Error(p + " could not load.")));
        a.nonce = (m.querySelector("script[nonce]") as HTMLScriptElement | null)?.nonce || "";
        m.head.append(a);
      }));
    d[l]
      ? console.warn(p + " only loads once. Ignoring:", g)
      : (d[l] = (f: string, ...n: unknown[]) => r.add(f) && u().then(() => d[l](f, ...n)));
  })({ key: apiKey, v: "weekly" });
}

let libsPromise: Promise<void> | null = null;

/**
 * Loads the Google Maps JavaScript API (core + Marker + Places + Geocoding)
 * exactly once, however many components ask for it. Resolves only once the
 * libraries are actually usable.
 */
export function loadGoogleMaps(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (libsPromise) return libsPromise;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured"));
  }

  installLoader(apiKey);

  libsPromise = Promise.all([
    window.google.maps.importLibrary("maps"),
    window.google.maps.importLibrary("marker"),
    window.google.maps.importLibrary("places"),
    window.google.maps.importLibrary("geocoding"),
  ]).then(() => undefined);

  return libsPromise;
}
