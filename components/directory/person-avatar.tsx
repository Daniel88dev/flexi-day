import { AvatarBubble } from "@/components/brand/avatar-bubble";
import type { DirectoryPerson } from "@/lib/api/directory";

/** The Profile photo once it exists, else the Account picture, else initials. */
export function PersonAvatar({ person, size = 40 }: { person: DirectoryPerson; size?: number }) {
  if (person.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a static export has no image optimizer
      <img
        src={person.image}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <AvatarBubble
      initials={person.user.initials}
      background={person.user.avatarColor}
      name={person.name}
      size={size}
    />
  );
}
