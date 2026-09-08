import type { FocusIndicator } from "@/hooks/useTapToFocus";
import { Sun } from "lucide-react";

const RETICLE_SIZE = 72;
const RAIL_HEIGHT = 132;
const RAIL_WIDTH = 24;
/** Distância do centro do reticle até o eixo do trilho de exposição. */
const RAIL_OFFSET = 58;

interface CameraFocusOverlayProps {
  indicator: FocusIndicator | null;
  hasExposureControl: boolean;
}

/**
 * Retorno visual do toque para focar. É decorativo e não recebe ponteiro: quem
 * escuta o gesto é o próprio `<video>`, para não cobrir o menu de navegação.
 */
export function CameraFocusOverlay({
  indicator,
  hasExposureControl,
}: CameraFocusOverlayProps) {
  if (!indicator) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div
        key={indicator.key}
        className="camera-focus absolute"
        style={{ left: indicator.x, top: indicator.y }}
      >
        <div
          className="camera-focus-fade"
          style={{ opacity: indicator.isFading ? 0 : 1 }}
        >
          <span
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border-2 border-amber-500"
            style={{ width: RETICLE_SIZE, height: RETICLE_SIZE }}
          />

          {hasExposureControl ? (
            <span
              className="absolute flex -translate-y-1/2 justify-center"
              style={{
                left:
                  (indicator.isFlipped ? -RAIL_OFFSET : RAIL_OFFSET) -
                  RAIL_WIDTH / 2,
                width: RAIL_WIDTH,
                height: RAIL_HEIGHT,
              }}
            >
              <span className="h-full w-0.5 rounded-full bg-amber-500/40" />
              <Sun
                className="absolute left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 text-amber-500"
                style={{ top: (1 - indicator.exposureRatio) * RAIL_HEIGHT }}
              />
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
