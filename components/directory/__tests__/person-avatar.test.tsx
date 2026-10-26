import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import type { DirectoryPerson } from "@/lib/api/directory";
import { PersonAvatar } from "../person-avatar";

const jana = (overrides: Partial<DirectoryPerson> = {}): DirectoryPerson => ({
  employmentId: "emp-jana",
  name: "Jana Member",
  jobTitle: null,
  image: null,
  photoUrl: null,
  user: { id: "u-jana", name: "Jana Member", initials: "JM", avatarColor: "hsl(10, 65%, 50%)" },
  markers: [],
  ...overrides,
});

const shown = (container: HTMLElement) => container.querySelector("img")?.getAttribute("src");

describe("PersonAvatar", () => {
  it("shows the Profile photo ahead of the Account picture", () => {
    const { container } = render(
      <PersonAvatar
        person={jana({ photoUrl: "https://store.test/small.jpg", image: "https://idp.test/a.png" })}
      />
    );
    expect(shown(container)).toBe("https://store.test/small.jpg");
  });

  it("takes a larger size of the photo when one is passed", () => {
    const { container } = render(
      <PersonAvatar
        person={jana({ photoUrl: "https://store.test/small.jpg" })}
        photoUrl="https://store.test/full.jpg"
        size={72}
      />
    );
    expect(shown(container)).toBe("https://store.test/full.jpg");
  });

  it("falls back to the Account picture, then to initials", () => {
    const withPicture = render(<PersonAvatar person={jana({ image: "https://idp.test/a.png" })} />);
    expect(shown(withPicture.container)).toBe("https://idp.test/a.png");

    const bare = render(<PersonAvatar person={jana()} />);
    expect(bare.container.querySelector("img")).toBeNull();
    expect(bare.container.textContent).toContain("JM");
  });
});
