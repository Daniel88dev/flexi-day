/** The backend's rule too: case and extra spaces don't make a typed name wrong. */
export const sameName = (typed: string, expected: string) => {
  const normalize = (value: string) =>
    value.normalize("NFC").trim().replace(/\s+/g, " ").toLocaleLowerCase();
  return normalize(typed) === normalize(expected);
};
