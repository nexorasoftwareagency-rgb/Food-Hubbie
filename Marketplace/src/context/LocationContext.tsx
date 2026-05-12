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
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState((prev) => ({
            ...prev,
            coords: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
            permissionStatus: "granted",
            address: "123, Main Street, Bengaluru", // Mock address
          }));
        },
        () => {
          setState((prev) => ({ ...prev, permissionStatus: "denied" }));
        }
      );
    } else {
      setState((prev) => ({ ...prev, permissionStatus: "denied" }));
    }
  };

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
