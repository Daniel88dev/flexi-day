import { Badge } from "@/components/ui/badge";
import type { DirectoryMarker } from "@/lib/api/directory";
import { useTranslation } from "@/lib/i18n/use-translation";

/** `hold` adds the Retention hold badge, which the Former list sends beside the markers. */
export function DirectoryMarkers({
  markers,
  hold = false,
}: {
  markers: DirectoryMarker[];
  hold?: boolean;
}) {
  const { t } = useTranslation();
  if (markers.length === 0 && !hold) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {markers.map((marker) => (
        <Badge key={marker} variant="outline" data-testid={`marker-${marker}`}>
          {t.directory.markers[marker]}
        </Badge>
      ))}
      {hold ? (
        <Badge variant="outline" data-testid="marker-HOLD">
          {t.directory.retention.holdMarker}
        </Badge>
      ) : null}
    </span>
  );
}
