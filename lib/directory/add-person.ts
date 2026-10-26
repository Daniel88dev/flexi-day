import type { NewDirectoryPerson, WorkerType } from "@/lib/api/directory";

export type NewPersonValues = {
  name: string;
  type: WorkerType;
  email: string;
  jobTitle: string;
  departmentId: string;
  locationId: string;
  reportsToEmploymentId: string;
};

export const EMPTY_NEW_PERSON: NewPersonValues = {
  name: "",
  type: "employee",
  email: "",
  jobTitle: "",
  departmentId: "",
  locationId: "",
  reportsToEmploymentId: "",
};

export type NewPersonProblems = { name?: "missing"; email?: "invalid" | "taken" };

/** Close to the backend's rule; the server has the last word. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** What the form can tell without the server: a missing name and an email that isn't one. */
export function newPersonProblems(values: NewPersonValues): NewPersonProblems {
  const problems: NewPersonProblems = {};
  if (values.name.trim() === "") problems.name = "missing";
  const email = values.email.trim();
  if (email !== "" && !EMAIL.test(email)) problems.email = "invalid";
  return problems;
}

export function newPersonBody(values: NewPersonValues): NewDirectoryPerson {
  const email = values.email.trim().toLowerCase();
  const card = Object.fromEntries(
    (["jobTitle", "departmentId", "locationId", "reportsToEmploymentId"] as const)
      .map((key) => [key, values[key].trim()] as const)
      .filter(([, value]) => value !== "")
  );
  return {
    name: values.name.trim(),
    type: values.type,
    email: email === "" ? null : email,
    ...(Object.keys(card).length > 0 && { card }),
  };
}
