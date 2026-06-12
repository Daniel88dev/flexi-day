"use client";

import React, { createContext, useContext, useState } from "react";
import { LeaveRequest, INITIAL_REQUESTS } from "./data";

interface StoreContextValue {
  requests: LeaveRequest[];
  addRequest: (req: LeaveRequest) => void;
  updateStatus: (id: string, status: LeaveRequest["status"]) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<LeaveRequest[]>(INITIAL_REQUESTS);

  function addRequest(req: LeaveRequest) {
    setRequests((prev) => [req, ...prev]);
  }

  function updateStatus(id: string, status: LeaveRequest["status"]) {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  }

  return (
    <StoreContext.Provider value={{ requests, addRequest, updateStatus }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
