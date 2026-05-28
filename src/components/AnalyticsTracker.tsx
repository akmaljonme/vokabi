import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAnalytics } from "@/hooks/useAnalytics";

export const AnalyticsTracker = () => {
  const location = useLocation();
  const { trackPageView } = useAnalytics();

  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return null;
};
