import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { TEMPLATE_HIGHLIGHT_DURATION_MS } from "saltbox-core/shared/constants/template-highlight-duration";

import type { TemplateSourceNavigationState } from "../../shared/types/template-source-navigation-state";

export function useHighlightedTemplateFromNavigation(isSourceLoaded: boolean): string | null {
  const location = useLocation();
  const navigate = useNavigate();
  const [highlightedTemplateId, setHighlightedTemplateId] = useState<string | null>(null);
  const initialHighlightRef = useRef<TemplateSourceNavigationState | null | undefined>(undefined);

  if (initialHighlightRef.current === undefined) {
    const navigationState = location.state as TemplateSourceNavigationState | null;
    initialHighlightRef.current = navigationState?.highlightedTemplateId ? navigationState : null;
  }

  useEffect(() => {
    const highlightState = initialHighlightRef.current;
    if (!highlightState?.highlightedTemplateId || !isSourceLoaded) {
      return;
    }

    const navigationState = location.state as TemplateSourceNavigationState | null;
    if (navigationState?.highlightedTemplateId) {
      navigate(location.pathname, { replace: true, state: null });
    }

    setHighlightedTemplateId(highlightState.highlightedTemplateId);

    const timer = window.setTimeout(() => {
      setHighlightedTemplateId(null);
      initialHighlightRef.current = null;
    }, TEMPLATE_HIGHLIGHT_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [isSourceLoaded, location.pathname, location.state, navigate]);

  return highlightedTemplateId;
}
