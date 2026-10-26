"use client";

import {
  createContext,
  useCallback,
  use,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  showSensitiveSection,
  type DirectoryProfile,
  type SensitiveSection,
  type ShownContact,
  type ShownPersonal,
} from "@/lib/api/directory";
import { useTranslation } from "@/lib/i18n/use-translation";

type Opened = { contact?: ShownContact; personal?: ShownPersonal };
type Store = {
  /** `organizationId/employmentId` of the person the opened Sections belong to. */
  person: string | null;
  opened: Opened;
};

type ShownSectionsContext = {
  store: Store;
  setStore: (update: (store: Store) => Store) => void;
};

const Context = createContext<ShownSectionsContext | null>(null);

/**
 * Holds the Sensitive sections opened for one person while the viewer stays on
 * that person's profile and edit pages. It sits in the person layout, so it
 * lives as long as the visit: leaving the person drops it, and coming back
 * means a new Show and a new read-log row.
 */
export function ShownSectionsProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>({ person: null, opened: {} });
  const value = useMemo(() => ({ store, setStore }), [store]);
  return <Context value={value}>{children}</Context>;
}

type ShownOf<S extends SensitiveSection> = S extends "contact" ? ShownContact : ShownPersonal;

/**
 * One Sensitive section of one profile: its values once shown, and `show`,
 * which fetches them. The person's own Sections open by themselves, since
 * reading them writes nothing.
 */
export function useShownSection<S extends SensitiveSection>(profile: DirectoryProfile, section: S) {
  const context = use(Context);
  // Outside the person layout (a test, a stray page) the opened Section lives as long as the component.
  const [localStore, setLocalStore] = useState<Store>({ person: null, opened: {} });
  const { store, setStore } = context ?? { store: localStore, setStore: setLocalStore };
  const { locale } = useTranslation();
  const person = `${profile.organizationId}/${profile.employmentId}`;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const askedRef = useRef(false);

  useEffect(() => {
    if (store.person !== person) setStore(() => ({ person, opened: {} }));
  }, [person, store.person, setStore]);

  const data =
    store.person === person ? (store.opened[section] as ShownOf<S> | undefined) : undefined;

  const put = useCallback(
    (shown: ShownOf<S>) =>
      setStore((current) => ({
        person,
        opened: { ...(current.person === person ? current.opened : {}), [section]: shown },
      })),
    [person, section, setStore]
  );

  const show = useCallback(async () => {
    setPending(true);
    setError(null);
    try {
      const shown = await showSensitiveSection(
        profile.organizationId,
        profile.employmentId,
        section,
        locale
      );
      put(shown as ShownOf<S>);
    } catch (caught) {
      setError(caught);
    } finally {
      setPending(false);
    }
  }, [profile.organizationId, profile.employmentId, section, locale, put]);

  const readable = profile.sections[section] !== undefined;
  useEffect(() => {
    if (!profile.self || !readable || data || askedRef.current) return;
    askedRef.current = true;
    void show();
  }, [profile.self, readable, data, show]);

  return { data, show, pending, error, put };
}
