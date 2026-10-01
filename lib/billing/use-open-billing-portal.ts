"use client";

import { pushToast } from "@/components/toast";
import { useCreatePortalSession } from "@/lib/api/queries";
import { useTranslation } from "@/lib/i18n/use-translation";

export function useOpenBillingPortal() {
  const { t } = useTranslation();
  const portal = useCreatePortalSession();

  async function open() {
    // Opened synchronously: awaiting first breaks the user-gesture chain and
    // Safari blocks the popup outright. `noopener` must not go in the feature
    // string — it makes window.open return null, which strands the blank tab
    // and sends this one to Paddle instead. Sever the handle by hand while the
    // new tab is still same-origin.
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    try {
      const { url } = await portal.mutateAsync();
      if (tab) tab.location.href = url;
      else window.location.href = url;
    } catch (err) {
      tab?.close();
      pushToast(err instanceof Error ? err.message : t.billing.portalFailed, "danger");
    }
  }

  return { open, isPending: portal.isPending };
}
