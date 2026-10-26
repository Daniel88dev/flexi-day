import { AvatarBubble } from "@/components/brand/avatar-bubble";
import type { DirectoryPerson } from "@/lib/api/directory";

/**
 * The directory's avatar: the Profile photo, then the Account picture, then
 * initials. `photoUrl` picks a larger size of the photo, such as the full one
 * on the profile header. Screens outside the directory keep the Account picture.
 */
export function PersonAvatar({
  person,
  photoUrl,
  size = 40,
}: {
  person: DirectoryPerson;
  photoUrl?: string | null;
  size?: number;
}) {
  const src = photoUrl ?? person.photoUrl ?? person.image;
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a static export has no image optimizer
      <img
        src={src}
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
