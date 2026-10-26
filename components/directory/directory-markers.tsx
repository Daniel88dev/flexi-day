import { Badge } from "@/components/ui/badge";
import type { DirectoryMarker } from "@/lib/api/directory";
import { useTranslation } from "@/lib/i18n/use-translation";

export function DirectoryMarkers({ markers }: { markers: DirectoryMarker[] }) {
  const { t } = useTranslation();
  if (markers.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {markers.map((marker) => (
        <Badge key={marker} variant="outline" data-testid={`marker-${marker}`}>
          {t.directory.markers[marker]}
        </Badge>
      ))}
    </span>
  );
}
