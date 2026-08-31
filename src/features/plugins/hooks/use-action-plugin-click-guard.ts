import { useWithAcceptedMastersCheck } from "@saltbox/saltbox-frontend-common";
import type { MessageInstance } from "antd/es/message/interface";
import { useMemo, useRef } from "react";
import { useNavigate } from "react-router";

import type { ActionPluginClickGuard } from "../types";

export function useActionPluginClickGuard(messageApi: MessageInstance): ActionPluginClickGuard {
  const navigate = useNavigate();
  const withAcceptedMastersCheck = useWithAcceptedMastersCheck(messageApi);
  const isCheckInFlightRef = useRef(false);

  return useMemo(
    () => ({
      withAcceptedMastersCheck: async (params) => {
        if (isCheckInFlightRef.current) {
          return;
        }

        isCheckInFlightRef.current = true;
        try {
          await withAcceptedMastersCheck(params);
        } finally {
          isCheckInFlightRef.current = false;
        }
      },
      navigate,
    }),
    [navigate, withAcceptedMastersCheck]
  );
}
