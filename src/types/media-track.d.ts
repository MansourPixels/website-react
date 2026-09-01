interface MediaTrackSupportedConstraints {
  torch?: boolean;
  focusMode?: boolean;
  exposureMode?: boolean;
  exposureCompensation?: boolean;
  pointsOfInterest?: boolean;
}

/**
 * pointsOfInterest de propósito não aparece aqui: a spec do Image Capture não o
 * inclui em capabilities, só em constraints e settings. Quem responde se o
 * navegador aceita o ponto de interesse é getSupportedConstraints().
 */
interface MediaTrackCapabilities {
  torch?: boolean;
  focusMode?: string[];
  exposureMode?: string[];
  exposureCompensation?: { min: number; max: number; step: number };
}

interface MediaTrackConstraintSet {
  torch?: ConstrainBoolean;
  focusMode?: ConstrainDOMString;
  exposureMode?: ConstrainDOMString;
  exposureCompensation?: ConstrainDouble;
  pointsOfInterest?: { x: number; y: number }[];
}

interface MediaTrackSettings {
  torch?: boolean;
  focusMode?: string;
  exposureMode?: string;
  exposureCompensation?: number;
  pointsOfInterest?: { x: number; y: number }[];
}
