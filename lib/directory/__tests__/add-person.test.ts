import { describe, expect, it } from "vitest";
import { EMPTY_NEW_PERSON, newPersonBody, newPersonProblems } from "../add-person";

describe("newPersonProblems", () => {
  it("asks for a name and nothing else on an empty form", () => {
    expect(newPersonProblems(EMPTY_NEW_PERSON)).toEqual({ name: "missing" });
  });

  it("flags an email that isn't one, and lets an empty email through", () => {
    expect(newPersonProblems({ ...EMPTY_NEW_PERSON, name: "Petra", email: "petra@" })).toEqual({
      email: "invalid",
    });
    expect(newPersonProblems({ ...EMPTY_NEW_PERSON, name: "Petra", email: "  " })).toEqual({});
    expect(
      newPersonProblems({ ...EMPTY_NEW_PERSON, name: " Petra ", email: "petra@example.test" })
    ).toEqual({});
  });
});

describe("newPersonBody", () => {
  it("sends the trimmed name and type, and leaves out what is empty", () => {
    expect(newPersonBody({ ...EMPTY_NEW_PERSON, name: "  Petra Nová " })).toEqual({
      name: "Petra Nová",
      type: "employee",
      email: null,
    });
  });

  it("sends the email lowercased and the Card fields that are set", () => {
    expect(
      newPersonBody({
        name: "Petra",
        type: "external",
        email: " Petra@Example.test ",
        jobTitle: " Cleaner ",
        departmentId: "d-1",
        locationId: "",
        reportsToEmploymentId: "e-1",
      })
    ).toEqual({
      name: "Petra",
      type: "external",
      email: "petra@example.test",
      card: { jobTitle: "Cleaner", departmentId: "d-1", reportsToEmploymentId: "e-1" },
    });
  });
});
