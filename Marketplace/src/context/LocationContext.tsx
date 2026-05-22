import { createContext, useContext, useState, ReactNode } from "react";

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
      // Very generous timeouts for mobile devices
      const highAccuracyOptions = { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 };
      const lowAccuracyOptions = { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 };
      
      const success = async (position: GeolocationPosition) => {
        const { latitude, longitude } = position.coords;
        
        setState((prev) => ({
          ...prev,
          coords: { lat: latitude, lng: longitude },
          permissionStatus: "granted",
          address: prev.address === "Unknown Location" ? "Detecting address..." : prev.address,
        }));

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, { signal: controller.signal });
          clearTimeout(timeoutId);
          const data = await res.json();
          const address = data.display_name.split(',').slice(0, 3).join(',') || `Area: ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
          
          setState((prev) => ({ ...prev, address }));
        } catch (e) {
          setState((prev) => ({ 
            ...prev, 
            address: `Area: ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
          }));
        }
      };

      const error = (err: GeolocationPositionError) => {
        if (err.code === 3) { // Timeout - try low accuracy
          navigator.geolocation.getCurrentPosition(success, (finalErr) => {
            setState((prev) => ({ ...prev, permissionStatus: "denied" }));
          }, lowAccuracyOptions);
        } else {
          setState((prev) => ({ ...prev, permissionStatus: "denied" }));
        }
      };

      navigator.geolocation.getCurrentPosition(success, error, highAccuracyOptions);
    } else {
      setState((prev) => ({ ...prev, permissionStatus: "denied" }));
    }
  };

  // Location is NOT auto-requested on mount — user must opt-in via "Allow"/"Detect" button

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
