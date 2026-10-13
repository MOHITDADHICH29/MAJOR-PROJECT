/**
 * Three.js 3D Scene Palette & Configuration
 * Tailored for soft, editorial medical-technology aesthetics
 */

export const SceneTheme = {
  // Backgrounds
  backgroundClear: 0xFAFCFB,
  backgroundMint: 0xE8F1EF,
  backgroundPale: 0xF4FAF8,

  // Mesh & Wireframe Colors
  brainMesh: 0xF0F7F5,          // Pale green / bone-white tissue
  brainMeshDark: 0xCCE3DD,
  brainWireframe: 0x1F4D45,     // Thin dark green anatomical lines
  brainWireframeSubtle: 0x7A8A87,

  // Electrodes & Sensors
  electrodeDefault: 0x1F4D45,   // Dark green standard node
  electrodeActive: 0x7CFF3F,    // Small lime glow for active channel
  electrodeRing: 0x8FD9CF,      // Mint halo
  
  // Fibers & Tractography
  tractographyTeal: 0x48A999,   // Muted teal fiber bundles
  tractographyGlow: 0x8FD9CF,   // Soft mint highlight

  // ROI & Anatomy boundaries
  roiBoundary: 0x4F6D8F,        // Muted slate-blue
  roiHighlight: 0x2E9E73,       // Healthy green accent
  roiAtrophy: 0xC8475A,         // Muted rose for volume loss

  // Lights
  hemiSkyColor: 0xFFFFFF,
  hemiGroundColor: 0xDCE9E6,
  hemiIntensity: 0.9,
  dirLightColor: 0xF5FAF8,
  dirLightIntensity: 0.7,
  ambientIntensity: 0.5,
};
