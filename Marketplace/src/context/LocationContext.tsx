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
      const highAccuracyOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 };
      const lowAccuracyOptions = { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 };
      
      const success = async (position: GeolocationPosition) => {
        const { latitude, longitude } = position.coords;
        
        // Update coordinates immediately so we can show outlets
        setState((prev) => ({
          ...prev,
          coords: { lat: latitude, lng: longitude },
          permissionStatus: "granted",
          address: prev.address || "Detecting address...",
        }));

        // Then try reverse geocoding in the background
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, { signal: controller.signal });
          clearTimeout(timeoutId);
          const data = await res.json();
          const address = data.display_name.split(',').slice(0, 3).join(',') || `GPS: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          
          setState((prev) => ({ ...prev, address }));
        } catch (e) {
          console.warn("Reverse geocoding failed, using coordinates as label");
          setState((prev) => ({ 
            ...prev, 
            address: prev.address === "Detecting address..." ? `Area: ${latitude.toFixed(2)}, ${longitude.toFixed(2)}` : prev.address 
          }));
        }
      };

      const error = (err: GeolocationPositionError) => {
        console.warn(`Location attempt failed (code ${err.code}): ${err.message}`);
        
        // If high accuracy failed/timed out, try low accuracy (faster, more reliable)
        if (err.code === 3 || err.code === 1) { 
          navigator.geolocation.getCurrentPosition(success, (finalErr) => {
            console.error("Final location fallback failed:", finalErr.message);
            setState((prev) => ({ ...prev, permissionStatus: "denied" }));
          }, lowAccuracyOptions);
        } else {
          setState((prev) => ({ ...prev, permissionStatus: "denied" }));
        }
      };

      // Start with high accuracy request
      navigator.geolocation.getCurrentPosition(success, error, highAccuracyOptions);
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
