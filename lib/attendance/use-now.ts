"use client";

import { useEffect, useState } from "react";

/**
 * A clock that re-renders its caller while `running`. Everything attendance
 * shows reads in whole minutes, so a tick a quarter of a minute apart is
 * already four times finer than anything on screen.
 */
export function useNow(running: boolean): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(id);
  }, [running]);

  return now;
}
