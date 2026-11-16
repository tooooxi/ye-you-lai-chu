"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveState = "saved" | "dirty" | "saving" | "error";

export function useAutosave<T>(ready: boolean, value: T, save: (value: T) => Promise<void>, delay = 450) {
  const [state, setState] = useState<SaveState>("saved");
  const [error, setError] = useState("");
  const baseline = useRef<string | null>(null);
  const valueRef = useRef(value);
  const saveRef = useRef(save);
  const ticket = useRef(0);
  valueRef.current = value;
  saveRef.current = save;
  const json = JSON.stringify(value);

  const run = useCallback(async (snapshot: string) => {
    const current = ++ticket.current;
    setState("saving");
    setError("");
    try {
      await saveRef.current(JSON.parse(snapshot) as T);
      if (current !== ticket.current) return;
      baseline.current = snapshot;
      setState(JSON.stringify(valueRef.current) === snapshot ? "saved" : "dirty");
    } catch (err) {
      if (current !== ticket.current) return;
      setState("error");
      setError(err instanceof Error ? err.message : "没有写入");
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (baseline.current === null) {
      baseline.current = json;
      return;
    }
    if (baseline.current === json) {
      setState((current) => (current === "saving" ? current : "saved"));
      setError("");
      return;
    }
    setState("dirty");
    const timer = window.setTimeout(() => {
      void run(json);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [json, ready, delay, run]);

  useEffect(() => {
    const onLeave = (event: BeforeUnloadEvent) => {
      if (baseline.current !== null && baseline.current !== JSON.stringify(valueRef.current)) {
        event.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, []);

  const saveNow = useCallback(() => run(JSON.stringify(valueRef.current)), [run]);

  return { state, error, saveNow };
}
