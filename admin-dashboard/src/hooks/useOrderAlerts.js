import { useCallback, useRef, useEffect } from "react";

export default function useOrderAlerts() {
  const audioCtxRef = useRef(null);
  const continuousIntervalRef = useRef(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const playAlertSound = useCallback(() => {
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1000;
        osc2.type = "sine";
        gain2.gain.setValueAtTime(0.2, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc2.start(ctx.currentTime);
        osc2.stop(ctx.currentTime + 0.4);
      }, 200);
    } catch (_) {}
  }, [getAudioContext]);

  const startContinuousSound = useCallback(() => {
    if (continuousIntervalRef.current) return;
    continuousIntervalRef.current = setInterval(() => {
      playAlertSound();
    }, 2000);
  }, [playAlertSound]);

  const stopContinuousSound = useCallback(() => {
    if (continuousIntervalRef.current) {
      clearInterval(continuousIntervalRef.current);
      continuousIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const unlock = () => {
      try {
        const ctx = getAudioContext();
        if (ctx.state === "suspended") ctx.resume();
      } catch (_) {}
    };
    document.addEventListener("click", unlock, { once: true });
    document.addEventListener("touchstart", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, [getAudioContext]);

  useEffect(() => {
    return () => {
      if (continuousIntervalRef.current) {
        clearInterval(continuousIntervalRef.current);
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return { playAlertSound, startContinuousSound, stopContinuousSound };
}
