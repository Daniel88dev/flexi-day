import type { DirectoryPerson } from "@/lib/api/directory";

/** Close to the backend's rule; the server has the last word. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const looksLikeEmail = (value: string) => EMAIL.test(value);

export const isExternalWorker = (person: Pick<DirectoryPerson, "markers">) =>
  person.markers.includes("EXTERNAL_WORKER");
