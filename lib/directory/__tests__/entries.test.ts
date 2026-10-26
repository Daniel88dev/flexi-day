import { describe, expect, it } from "vitest";
import { entryFilterOptions, entryLabel, matchesEntries, pickerEntries } from "../entries";

const support = { id: "d1", name: "Support", archived: false };
const sales = { id: "d2", name: "Sales", archived: true };
const prague = { id: "l1", name: "Prague", archived: false };
const archived = (name: string) => `${name} (archived)`;

describe("entryLabel", () => {
  it("returns the name, marked when the entry is archived", () => {
    expect(entryLabel(support, archived)).toBe("Support");
    expect(entryLabel(sales, archived)).toBe("Sales (archived)");
  });
});

describe("entryFilterOptions", () => {
  it("returns each entry the rows hold once, by name", () => {
    const people = [
      { department: support, location: prague },
      { department: sales, location: null },
      { department: support },
    ];
    expect(entryFilterOptions(people, "department")).toEqual([sales, support]);
    expect(entryFilterOptions(people, "location")).toEqual([prague]);
  });
});

describe("matchesEntries", () => {
  const person = { department: support, location: prague };

  it("matches everyone while no filter is set", () => {
    expect(matchesEntries({}, { departmentId: "", locationId: "" })).toBe(true);
  });

  it("matches the picked department and location together", () => {
    expect(matchesEntries(person, { departmentId: "d1", locationId: "" })).toBe(true);
    expect(matchesEntries(person, { departmentId: "d1", locationId: "l1" })).toBe(true);
    expect(matchesEntries(person, { departmentId: "d2", locationId: "" })).toBe(false);
    expect(matchesEntries(person, { departmentId: "", locationId: "l2" })).toBe(false);
    expect(matchesEntries({ department: null }, { departmentId: "d1", locationId: "" })).toBe(
      false
    );
  });
});

describe("pickerEntries", () => {
  it("leaves archived entries out unless the record holds one", () => {
    expect(pickerEntries([support, sales], null)).toEqual([support]);
    expect(pickerEntries([support, sales], "d2")).toEqual([support, sales]);
    expect(pickerEntries([support, sales], "d1")).toEqual([support]);
  });
});
