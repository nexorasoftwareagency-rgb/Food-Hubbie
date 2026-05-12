import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type LocationState = {
  coords: { lat: number; lng: number } | null;
  address: string | null;
  permissionStatus: "prompt" | "granted" | "denied";
};

type LocationContextType = {
  state: LocationState;
  requestLocation: () => void;
  setAddress: (address: string) => void;
};

const LocationContext = createContext<LocationContextType | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LocationState>({
    coords: null,
    address: null,
    permissionStatus: "prompt",
  });

  const requestLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let address = "Unknown Location";
          
          try {
            // Free Reverse Geocoding (Nominatim) with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await res.json();
            address = data.display_name.split(',').slice(0, 2).join(',') || `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          } catch (e) {
            console.warn("Reverse geocoding failed, using coordinates.");
            address = `Detected: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          }

          setState((prev) => ({
            ...prev,
            coords: { lat: latitude, lng: longitude },
            permissionStatus: "granted",
            address: address, 
          }));
        },
        (error) => {
          console.error("Location error:", error);
          setState((prev) => ({ ...prev, permissionStatus: "denied" }));
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 300000 }
      );
    } else {
      setState((prev) => ({ ...prev, permissionStatus: "denied" }));
    }
  };

  // Auto-request location on mount
  useEffect(() => {
    requestLocation();
  }, []);

  const setAddress = (address: string) => {
    setState((prev) => ({ ...prev, address }));
  };

  return (
    <LocationContext.Provider value={{ state, requestLocation, setAddress }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocationContext() {
  const context = useContext(LocationContext);
  if (!context) throw new Error("useLocationContext must be used within LocationProvider");
  return context;
}
