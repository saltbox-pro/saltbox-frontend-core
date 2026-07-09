import type { TaskTemplatePublicSchema } from "@saltbox/saltbox-core-api-client";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { TEMPLATE_HIGHLIGHT_DURATION_MS } from "saltbox-core/shared/constants/template-highlight-duration";

import { resolveHighlightedTemplateId } from "../../shared/helpers/resolve-highlighted-template-id";
import type { TemplateSourceNavigationState } from "../../shared/types/template-source-navigation-state";

function hasHighlightState(
  navigationState: TemplateSourceNavigationState | null | undefined
): boolean {
  return Boolean(
    navigationState?.highlightedTemplateId ?? navigationState?.highlightedTemplateName
  );
}

export function useHighlightedTemplateFromNavigation(
  templates: TaskTemplatePublicSchema[] | undefined,
  isSourceLoaded: boolean
): string | null {
  const location = useLocation();
  const navigate = useNavigate();
  const [highlightedTemplateId, setHighlightedTemplateId] = useState<string | null>(null);
  const initialHighlightRef = useRef<TemplateSourceNavigationState | null | undefined>(undefined);

  if (initialHighlightRef.current === undefined) {
    const navigationState = location.state as TemplateSourceNavigationState | null;
    initialHighlightRef.current = hasHighlightState(navigationState) ? navigationState : null;
  }

  useEffect(() => {
    const highlightState = initialHighlightRef.current;
    if (!hasHighlightState(highlightState) || !isSourceLoaded) {
      return;
    }

    const needsTemplatesList = Boolean(highlightState?.highlightedTemplateName);
    if (needsTemplatesList && templates === undefined) {
      return;
    }

    const navigationState = location.state as TemplateSourceNavigationState | null;
    if (hasHighlightState(navigationState)) {
      navigate(location.pathname, { replace: true, state: null });
    }

    const templateId = resolveHighlightedTemplateId(highlightState, templates);
    if (!templateId) {
      if (templates !== undefined) {
        initialHighlightRef.current = null;
      }
      return;
    }

    setHighlightedTemplateId(templateId);

    const timer = window.setTimeout(() => {
      setHighlightedTemplateId(null);
      initialHighlightRef.current = null;
    }, TEMPLATE_HIGHLIGHT_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [isSourceLoaded, location.pathname, location.state, navigate, templates]);

  return highlightedTemplateId;
}
