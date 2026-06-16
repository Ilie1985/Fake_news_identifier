"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes

const protectedRoutes = [
  "/analyse",
  "/dashboard",
  "/history",
  "/ml-insights",
  "/account",
];

export default function AuthSessionManager() {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    async function checkUserAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (isProtectedRoute && !user) {
        router.replace("/login");
        return;
      }
    }

    checkUserAccess();
  }, [pathname, router]);

  useEffect(() => {
    async function logoutUserBecauseOfInactivity() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.auth.signOut();
        router.replace("/login");
      }
    }

    function resetInactivityTimer() {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        logoutUserBecauseOfInactivity();
      }, INACTIVITY_LIMIT);
    }

    const activityEvents = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimer);
    });

    resetInactivityTimer();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimer);
      });
    };
  }, [router]);

  return null;
}