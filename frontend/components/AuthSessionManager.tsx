"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 minutes

export default function AuthSessionManager() {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const publicPages = ["/login", "/register"];
    const isPublicPage = publicPages.includes(pathname);

    async function logoutUserBecauseOfInactivity() {
      const { data } = await supabase.auth.getUser();

      if (data.user) {
        await supabase.auth.signOut();

        if (!isPublicPage) {
          router.push("/login");
        }
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
  }, [pathname, router]);

  return null;
}