"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then(async (registration) => {
        if ("sync" in registration) {
          try {
            await registration.sync.register("expense-sync");
          } catch {
            // Some browsers gate background sync behind permissions.
          }
        }
      })
      .catch(() => {
        // Registration failure should not break the app shell.
      });
  }, []);

  return null;
}
