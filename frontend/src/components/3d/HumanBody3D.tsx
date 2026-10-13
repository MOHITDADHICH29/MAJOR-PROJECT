import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Brain, Activity, RotateCcw, Eye, Sparkles } from 'lucide-react';

interface LandmarkPin {
  id: number;
  label: string;
  name: string;
  category: string;
  finding: string;
  coords: [number, number, number];
}

const LANDMARK_PINS: LandmarkPin[] = [
  {
    id: 1,
    label: '1',
    name: 'Cerebral Cortex & DLPFC',
    category: 'Central Nervous System',
    finding: 'Bilateral prefrontal gyri; elevated theta/alpha ratio and microstructural divergence.',
    coords: [0, 8.2, 0.2]
  },
  {
    id: 2,
    label: '2',
    name: 'Brainstem & Cervical Medulla',
    category: 'CNS Origin',
    finding: 'Ascending reticular activating system and auditory sensory gating relay node.',
    coords: [0, 6.7, -0.3]
  },
  {
    id: 3,
    label: '3',
    name: 'Spinal Cord & Brachial Plexus',
    category: 'Peripheral Convergence',
    finding: 'Continuous central neural axis (C1-T12) distributing bilateral upper-extremity motor fibers.',
    coords: [0, 4.8, -0.25]
  },
  {
    id: 4,
    label: '4',
    name: 'Lumbar Enlargement & Cauda Equina',
    category: 'Spinal Axis',
    finding: 'Major somatosensory junction giving rise to lumbosacral plexus and sciatic conduits.',
    coords: [0, -1.2, -0.2]
  },
  {
    id: 5,
    label: '5',
    name: 'Sciatic Nerve & Tibial Conduits',
    category: 'Peripheral Nervous System',
    finding: 'Distal neuro-filament network conducting bilateral efferent/afferent motor-sensory signals.',
    coords: [1.2, -7.5, 0.0]
  }
];

interface HumanBody3DProps {
  onTransitionToBrain?: () => void;
  interactive?: boolean;
  focusRegion?: 'full' | 'nervous' | 'spine' | 'head';
  className?: string;
}

export const HumanBody3D: React.FC<HumanBody3DProps> = ({
  onTransitionToBrain,
  interactive = true,
  focusRegion = 'full',
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglSupported, setWebglSupported] = useState(true);
  const [activePin, setActivePin] = useState<LandmarkPin | null>(LANDMARK_PINS[0]);
  const [hoveredPin, setHoveredPin] = useState<LandmarkPin | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const isRotatingRef = useRef(true);
  const [pinScreenCoords, setPinScreenCoords] = useState<{ id: number; x: number; y: number; visible: boolean }[]>([]);
  const controlsRef = useRef<any>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Camera preset handlers
  const setCameraView = (view: 'front' | 'back' | 'head' | 'reset') => {
    if (!controlsRef.current || !cameraRef.current) return;
    const controls = controlsRef.current;
    const camera = cameraRef.current;

    setIsRotating(false);

    if (view === 'front') {
      camera.position.set(0, -2.5, 30.0);
      controls.target.set(0, -2.5, 0);
    } else if (view === 'back') {
      camera.position.set(0, -2.5, -30.0);
      controls.target.set(0, -2.5, 0);
    } else if (view === 'head') {
      camera.position.set(0, 8.2, 7.5);
      controls.target.set(0, 8.0, 0);
    } else if (view === 'reset') {
      camera.position.set(15.0, 1.5, 26.0);
      controls.target.set(0, -2.5, 0);
      setIsRotating(true);
    }
    controls.update();
  };

  useEffect(() => {
    isRotatingRef.current = isRotating;
    if (controlsRef.current) controlsRef.current.autoRotate = isRotating;
  }, [isRotating]);

  useEffect(() => {
    if (!controlsRef.current || !cameraRef.current) return;
    const controls = controlsRef.current;
    const camera = cameraRef.current;

    if (focusRegion === 'head') {
      camera.position.set(2.8, 8.5, 6.5);
      controls.target.set(0, 8.0, 0);
    } else if (focusRegion === 'spine' || focusRegion === 'nervous') {
      camera.position.set(6.5, 2.5, 14.0);
      controls.target.set(0, 2.0, 0);
    } else {
      camera.position.set(15.0, 1.5, 26.0);
      controls.target.set(0, -2.5, 0);
    }
    controls.update();
  }, [focusRegion]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let initiated = false;

    const init = (width: number, height: number) => {
      if (initiated) return;
      initiated = true;

      // ── SCENE (Dark charcoal background as per reference image) ──
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x1F2022); // Deep rich dark charcoal
      scene.fog = new THREE.FogExp2(0x1F2022, 0.008);

      const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
      if (focusRegion === 'head') {
        camera.position.set(2.8, 8.5, 6.5);
        camera.lookAt(0, 8.0, 0);
      } else if (focusRegion === 'spine' || focusRegion === 'nervous') {
        camera.position.set(6.5, 2.5, 14.0);
        camera.lookAt(0, 2.0, 0);
      } else {
        camera.position.set(15.0, 1.5, 26.0);
        camera.lookAt(0, -2.5, 0);
      }
      cameraRef.current = camera;

      let renderer: THREE.WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      } catch {
        setWebglSupported(false);
        return;
      }

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.35;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = true;
      controls.maxDistance = 45;
      controls.minDistance = 6;
      controls.autoRotate = isRotatingRef.current;
      controls.autoRotateSpeed = 0.65;
      controls.target.set(0, focusRegion === 'head' ? 8.0 : (focusRegion === 'spine' || focusRegion === 'nervous' ? 2.0 : -0.5), 0);
      controlsRef.current = controls;

      // ── LIGHTING (Warm golden and amber illumination matching reference) ──
      scene.add(new THREE.AmbientLight(0x2a2825, 1.2));

      // Key Warm Golden Light
      const goldenKey = new THREE.DirectionalLight(0xFFE4A0, 2.4);
      goldenKey.position.set(16, 22, 18);
      scene.add(goldenKey);

      // ── LIGHTING (Clean anatomical research illumination) ──
      scene.add(new THREE.AmbientLight(0x2d3238, 1.4));

      // Key Directional Light
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
      keyLight.position.set(16, 22, 18);
      scene.add(keyLight);

      // Soft Cool Rim Light
      const coolRim = new THREE.DirectionalLight(0xcde0e8, 1.4);
      coolRim.position.set(-18, 10, -20);
      scene.add(coolRim);

      // Brain Luminescence Point Light (Natural pale silver/ivory glow)
      const brainGlow = new THREE.PointLight(0xdce6eb, 2.5, 12);
      brainGlow.position.set(0, 8.2, 0.4);
      scene.add(brainGlow);

      // Spine Central Illuminator (Subtle neutral warm-white)
      const spineGlow = new THREE.PointLight(0xe5ecef, 1.2, 15);
      spineGlow.position.set(0, 2.5, -0.2);
      scene.add(spineGlow);

      const modelRoot = new THREE.Group();
      scene.add(modelRoot);

      // ── MATERIALS (Natural Anatomical Tissues: Ivory, Soft Cream & Gray Matter) ──
      // Brain: Natural cerebral cortical gray/pinkish-taupe matter
      const brainMat = new THREE.MeshStandardMaterial({
        color: 0xC4BBB5, // Natural anatomical cerebral cortex
        roughness: 0.45,
        metalness: 0.08,
        emissive: new THREE.Color(0x383430),
        emissiveIntensity: 0.25
      });

      // Spinal Cord: Natural ivory / myelinated white matter
      const cordMat = new THREE.MeshStandardMaterial({
        color: 0xE8E2D8, // Natural myelinated spinal cord ivory
        roughness: 0.35,
        metalness: 0.10,
        emissive: new THREE.Color(0x403D38),
        emissiveIntensity: 0.30
      });

      // Major Nerve Trunks: Natural peripheral myelin pale cream
      const majorNerveMat = new THREE.MeshStandardMaterial({
        color: 0xD6CFC4, // Natural peripheral nerve trunk
        roughness: 0.42,
        metalness: 0.08,
        emissive: new THREE.Color(0x2C2A26),
        emissiveIntensity: 0.20
      });

      // Fine Nerve Branches: Delicate natural terminal nerve filaments
      const fineNerveMat = new THREE.MeshStandardMaterial({
        color: 0xBBB3A6, // Fine distal branches
        roughness: 0.48,
        metalness: 0.05,
        emissive: new THREE.Color(0x1E1C1A),
        emissiveIntensity: 0.15
      });

      // Ghost Wireframe Skeleton Silhouette
      const subtleGhostMat = new THREE.MeshBasicMaterial({
        color: 0x5C636E,
        transparent: true,
        opacity: 0.10,
        wireframe: true
      });

      const makeTube = (pts: THREE.Vector3[], radius: number, segs: number, mat: THREE.Material, radSegs = 5) => {
        const curve = new THREE.CatmullRomCurve3(pts);
        const geo = new THREE.TubeGeometry(curve, segs, radius, radSegs, false);
        return new THREE.Mesh(geo, mat);
      };

      // =====================================================================
      // 1. ANATOMICALLY DETAILED GOLDEN-YELLOW BRAIN
      // =====================================================================
      const brainGroup = new THREE.Group();
      brainGroup.position.set(0, 8.2, 0);
      modelRoot.add(brainGroup);

      // Left & Right Cerebral Hemispheres with realistic gyri / sulcal surface
      [-0.45, 0.45].forEach((xHem) => {
        const hemGeo = new THREE.SphereGeometry(1.05, 36, 36);
        const pos = hemGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const vx = pos.getX(i);
          const vy = pos.getY(i);
          const vz = pos.getZ(i);
          // Realistic gyral perturbation
          const gyri =
            Math.sin(vx * 12.0) * Math.cos(vy * 10.0) * 0.075 +
            Math.sin(vz * 11.0) * Math.cos(vx * 9.0) * 0.055 +
            Math.cos(vy * 14.0) * Math.sin(vz * 8.0) * 0.035;
          pos.setXYZ(i, vx + gyri, vy + gyri, vz + gyri);
        }
        hemGeo.computeVertexNormals();
        const hemMesh = new THREE.Mesh(hemGeo, brainMat);
        hemMesh.position.set(xHem, 0, 0.05);
        hemMesh.scale.set(0.85, 0.95, 1.15); // Human brain proportions
        brainGroup.add(hemMesh);
      });

      // Cerebellum (posterior & inferior to cerebrum)
      [-0.38, 0.38].forEach((xCereb) => {
        const cerebGeo = new THREE.SphereGeometry(0.55, 24, 24);
        const pos = cerebGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const cy = pos.getY(i);
          pos.setY(i, cy + Math.sin(cy * 26.0) * 0.035);
        }
        cerebGeo.computeVertexNormals();
        const cerebMesh = new THREE.Mesh(cerebGeo, brainMat);
        cerebMesh.position.set(xCereb, -0.72, -0.65);
        cerebMesh.scale.set(0.9, 0.75, 0.85);
        brainGroup.add(cerebMesh);
      });

      // Brainstem (Pons & Medulla) smoothly transitioning directly into spinal cord
      const stemPoints = [
        new THREE.Vector3(0, -0.3, -0.15),
        new THREE.Vector3(0, -0.75, -0.25),
        new THREE.Vector3(0, -1.25, -0.32)
      ];
      brainGroup.add(makeTube(stemPoints, 0.28, 16, cordMat, 8));

      // Cranial Nerves originating from brainstem and skull base
      [
        [-0.4, -0.6, 0.35], [0.4, -0.6, 0.35],   // Optic & Oculomotor
        [-0.7, -0.8, -0.05], [0.7, -0.8, -0.05], // Trigeminal & Facial
        [-0.55, -1.1, -0.3], [0.55, -1.1, -0.3], // Vagus & Accessory
      ].forEach(([ox, oy, oz]) => {
        brainGroup.add(makeTube([
          new THREE.Vector3(ox * 0.3, oy, oz * 0.3),
          new THREE.Vector3(ox * 0.7, oy - 0.15, oz * 0.7),
          new THREE.Vector3(ox, oy - 0.35, oz)
        ], 0.035, 10, majorNerveMat, 4));
      });

      // =====================================================================
      // 2. CONTINUOUS CENTRAL SPINAL CORD (Cervical, Thoracic, Lumbar, Sacral)
      // =====================================================================
      const spinePoints: THREE.Vector3[] = [];
      const spineSteps = 36;
      const topY = 6.95, botY = -2.85;

      for (let i = 0; i <= spineSteps; i++) {
        const t = i / spineSteps;
        const y = topY - t * (topY - botY);
        // Realistic human spinal curvature (Cervical lordosis, Thoracic kyphosis, Lumbar lordosis)
        const z = -0.32 + Math.sin(t * Math.PI) * 0.42 - Math.sin(t * Math.PI * 2.0) * 0.22;
        spinePoints.push(new THREE.Vector3(0, y, z));
      }
      const spineCurve = new THREE.CatmullRomCurve3(spinePoints);

      // Prominent Golden Spinal Cord Tube
      const spineMesh = new THREE.Mesh(
        new THREE.TubeGeometry(spineCurve, 72, 0.175, 12, false),
        cordMat
      );
      modelRoot.add(spineMesh);

      // =====================================================================
      // 3. COMPLETE PERIPHERAL NERVE LATTICE & BILATERAL BRANCHING
      // =====================================================================
      const nerveGroup = new THREE.Group();
      modelRoot.add(nerveGroup);

      // Cervical Plexus & Neck Nerves (C1 - C4)
      for (let c = 0; c < 5; c++) {
        const t = 0.02 + c * 0.035;
        const pt = spineCurve.getPoint(t);
        [-1, 1].forEach((side) => {
          nerveGroup.add(makeTube([
            pt,
            new THREE.Vector3(side * 0.65, pt.y - 0.12, pt.z + 0.18),
            new THREE.Vector3(side * 1.35, pt.y - 0.35, pt.z + 0.12),
            new THREE.Vector3(side * 1.95, pt.y - 0.65, pt.z - 0.05)
          ], 0.045 - c * 0.004, 12, majorNerveMat, 4));
        });
      }

      // Thoracic Spinal Nerves & Intercostal Cascades (12 Pairs)
      for (let r = 0; r < 12; r++) {
        const t = 0.20 + (r / 12) * 0.48;
        const pt = spineCurve.getPoint(t);
        const chestWidth = 1.75 + Math.sin((r / 12) * Math.PI) * 0.65;
        const depthCurve = 1.15 * Math.sin((r / 12) * Math.PI * 0.85 + 0.2);

        [-1, 1].forEach((side) => {
          // Major intercostal arc following ribcage curvature
          const ribArc: THREE.Vector3[] = [];
          for (let step = 0; step <= 12; step++) {
            const a = (step / 12) * Math.PI * 0.78;
            ribArc.push(new THREE.Vector3(
              side * Math.sin(a) * chestWidth,
              pt.y - a * 0.28 - r * 0.02,
              pt.z + Math.cos(a) * depthCurve
            ));
          }
          nerveGroup.add(makeTube(ribArc, 0.036 - (r > 8 ? 0.008 : 0), 12, majorNerveMat, 4));

          // Fine terminal cutaneous filaments branching across chest and abdomen
          const midPt = ribArc[Math.floor(ribArc.length * 0.65)];
          [
            [side * 0.35, -0.42, 0.15],
            [side * 0.45, -0.55, -0.12]
          ].forEach(([dx, dy, dz]) => {
            nerveGroup.add(makeTube([
              midPt,
              new THREE.Vector3(midPt.x + dx * 0.5, midPt.y + dy * 0.5, midPt.z + dz * 0.5),
              new THREE.Vector3(midPt.x + dx, midPt.y + dy, midPt.z + dz)
            ], 0.018, 6, fineNerveMat, 3));
          });
        });
      }

      // =====================================================================
      // 4. UPPER EXTREMITIES — BRACHIAL PLEXUS, ARMS, HANDS & FINGERS
      // =====================================================================
      [-1, 1].forEach((side) => {
        // Brachial Plexus Root Network (C5 - T1)
        [0, 0.15, 0.30, 0.45].forEach((offsetY, idx) => {
          const rootOrigin = spineCurve.getPoint(0.12 + idx * 0.025);
          nerveGroup.add(makeTube([
            rootOrigin,
            new THREE.Vector3(side * 0.85, 5.6 - offsetY * 0.4, -0.2),
            new THREE.Vector3(side * 1.85, 5.2 - offsetY * 0.5, 0.0),
            new THREE.Vector3(side * 2.85, 4.4, 0.12)
          ], 0.048 - idx * 0.005, 12, majorNerveMat, 4));
        });

        // Median & Radial Main Arm Conduits (Shoulder to Elbow)
        nerveGroup.add(makeTube([
          new THREE.Vector3(side * 2.85, 4.4, 0.12),
          new THREE.Vector3(side * 3.35, 3.2, 0.16),
          new THREE.Vector3(side * 3.65, 1.8, 0.12),
          new THREE.Vector3(side * 3.82, 0.4, 0.08) // Elbow joint
        ], 0.065, 20, cordMat, 5));

        // Forearm Nerves (Median, Ulnar, Radial trunks from Elbow to Wrist)
        const elbowPt = new THREE.Vector3(side * 3.82, 0.4, 0.08);
        const wristMed = new THREE.Vector3(side * 4.15, -1.8, 0.22);
        const wristUln = new THREE.Vector3(side * 3.85, -1.85, 0.02);
        const wristRad = new THREE.Vector3(side * 4.35, -1.75, -0.08);

        nerveGroup.add(makeTube([
          elbowPt,
          new THREE.Vector3(side * 3.98, -0.7, 0.18),
          wristMed
        ], 0.045, 14, majorNerveMat, 4));

        nerveGroup.add(makeTube([
          elbowPt,
          new THREE.Vector3(side * 3.84, -0.7, 0.04),
          wristUln
        ], 0.040, 14, majorNerveMat, 4));

        nerveGroup.add(makeTube([
          elbowPt,
          new THREE.Vector3(side * 4.12, -0.65, -0.02),
          wristRad
        ], 0.038, 14, majorNerveMat, 4));

        // Hands & 5 Individual Fingers (Phalangeal Nerves)
        const fingerSpreads = [
          { spreadX: 0.18, spreadZ: 0.22, len: 1.1, name: 'Thumb' },
          { spreadX: 0.08, spreadZ: 0.10, len: 1.35, name: 'Index' },
          { spreadX: 0.00, spreadZ: 0.00, len: 1.45, name: 'Middle' },
          { spreadX: -0.08, spreadZ: -0.08, len: 1.35, name: 'Ring' },
          { spreadX: -0.15, spreadZ: -0.15, len: 1.15, name: 'Little' }
        ];

        fingerSpreads.forEach((f) => {
          const handBase = wristMed.clone().add(new THREE.Vector3(side * f.spreadX * 0.4, -0.3, f.spreadZ * 0.3));
          const fingerMid = handBase.clone().add(new THREE.Vector3(side * f.spreadX * 0.8, -f.len * 0.5, f.spreadZ * 0.7));
          const fingerTip = handBase.clone().add(new THREE.Vector3(side * f.spreadX, -f.len, f.spreadZ));

          nerveGroup.add(makeTube([
            wristMed,
            handBase,
            fingerMid,
            fingerTip
          ], 0.024, 10, fineNerveMat, 3));
        });
      });

      // =====================================================================
      // 5. LOWER EXTREMITIES — LUMBOSACRAL PLEXUS, SCIATIC TRUNKS, LEGS & FEET
      // =====================================================================
      [-1, 1].forEach((side) => {
        // Lumbo-Sacral Convergence into Sciatic Trunk
        const lumbOrigin = spineCurve.getPoint(0.85);
        const hipJunction = new THREE.Vector3(side * 1.15, -3.4, -0.12);

        nerveGroup.add(makeTube([
          lumbOrigin,
          new THREE.Vector3(side * 0.55, -2.9, -0.18),
          hipJunction
        ], 0.065, 12, cordMat, 5));

        // Great Sciatic Nerve (Massive Conduit descending down Thigh to Popliteal Fossa / Knee)
        const kneeJunction = new THREE.Vector3(side * 1.45, -8.2, 0.02);
        nerveGroup.add(makeTube([
          hipJunction,
          new THREE.Vector3(side * 1.35, -4.8, -0.15),
          new THREE.Vector3(side * 1.48, -6.5, -0.08),
          kneeJunction
        ], 0.075, 24, cordMat, 5));

        // Femoral Anterior Nerve Branch
        nerveGroup.add(makeTube([
          hipJunction,
          new THREE.Vector3(side * 1.18, -4.5, 0.28),
          new THREE.Vector3(side * 1.30, -6.5, 0.32),
          new THREE.Vector3(side * 1.38, -8.0, 0.18)
        ], 0.045, 16, majorNerveMat, 4));

        // Lower Leg Bifurcation: Tibial & Common Fibular Nerves (Knee to Ankle)
        const ankleMed = new THREE.Vector3(side * 1.25, -13.2, 0.12);
        const ankleLat = new THREE.Vector3(side * 1.55, -13.1, -0.05);

        nerveGroup.add(makeTube([
          kneeJunction,
          new THREE.Vector3(side * 1.40, -9.8, 0.05),
          new THREE.Vector3(side * 1.32, -11.5, 0.10),
          ankleMed
        ], 0.050, 18, majorNerveMat, 4));

        nerveGroup.add(makeTube([
          kneeJunction,
          new THREE.Vector3(side * 1.62, -9.8, -0.05),
          new THREE.Vector3(side * 1.58, -11.5, -0.08),
          ankleLat
        ], 0.042, 18, majorNerveMat, 4));

        // Foot & 5 Individual Toes (Plantar & Digital Nerves)
        const toeSpreads = [
          { spreadX: 0.12, spreadZ: 1.45, len: 0.55, name: 'Great Toe' },
          { spreadX: 0.06, spreadZ: 1.55, len: 0.50, name: 'Second Toe' },
          { spreadX: 0.00, spreadZ: 1.50, len: 0.45, name: 'Third Toe' },
          { spreadX: -0.06, spreadZ: 1.40, len: 0.40, name: 'Fourth Toe' },
          { spreadX: -0.12, spreadZ: 1.30, len: 0.35, name: 'Fifth Toe' }
        ];

        toeSpreads.forEach((t) => {
          const heelPt = ankleMed.clone().add(new THREE.Vector3(0, -0.35, 0.2));
          const archPt = heelPt.clone().add(new THREE.Vector3(side * t.spreadX * 0.4, -0.15, 0.65));
          const toeTip = archPt.clone().add(new THREE.Vector3(side * t.spreadX, -0.05, t.len));

          nerveGroup.add(makeTube([
            ankleMed,
            heelPt,
            archPt,
            toeTip
          ], 0.024, 10, fineNerveMat, 3));
        });
      });

      // =====================================================================
      // 6. DELICATE SEMI-TRANSPARENT ANATOMICAL WIRE/SILHOUETTE
      // =====================================================================
      // Subtle faint contours of skull, ribcage, and pelvis to anchor the nervous system
      const ghostGroup = new THREE.Group();
      modelRoot.add(ghostGroup);

      // Skull silhouette
      const craniumGhost = new THREE.Mesh(new THREE.SphereGeometry(1.45, 20, 20), subtleGhostMat);
      craniumGhost.position.set(0, 8.2, 0.1);
      craniumGhost.scale.set(0.95, 1.05, 1.15);
      ghostGroup.add(craniumGhost);

      // Ribcage subtle volume
      const thoraxGhost = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.95, 4.8, 18, 1, true), subtleGhostMat);
      thoraxGhost.position.set(0, 3.8, 0);
      thoraxGhost.scale.set(1.2, 1.0, 0.85);
      ghostGroup.add(thoraxGhost);

      // Pelvis subtle volume
      const pelvisGhost = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 1.55, 2.2, 16, 1, true), subtleGhostMat);
      pelvisGhost.position.set(0, -1.8, -0.1);
      pelvisGhost.scale.set(1.15, 1.0, 0.85);
      ghostGroup.add(pelvisGhost);

      // =====================================================================
      // 7. GOLDEN ACTION POTENTIAL SYNAPSE PULSES
      // =====================================================================
      const pulseCount = 38;
      const pulseGeo = new THREE.BufferGeometry();
      const pulsePos = new Float32Array(pulseCount * 3);
      pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
      const pulseMat = new THREE.PointsMaterial({
        color: 0xFFF0B8,
        size: 0.32,
        transparent: true,
        opacity: 0.90,
        blending: THREE.AdditiveBlending
      });
      const pulseMesh = new THREE.Points(pulseGeo, pulseMat);
      modelRoot.add(pulseMesh);

      // ── ANIMATION LOOP ───────────────────────────────────────────
      let animId: number;
      const clock = new THREE.Clock();

      const animate = () => {
        animId = requestAnimationFrame(animate);
        const elapsed = clock.getElapsedTime();

        // Traveling neural impulses down the spinal cord
        const pArr = pulseGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < pulseCount; i++) {
          const t = (elapsed * 0.25 + i / pulseCount) % 1.0;
          const pt = spineCurve.getPoint(t);
          pArr[i * 3] = pt.x + (Math.sin(elapsed * 2.0 + i) * 0.05);
          pArr[i * 3 + 1] = pt.y;
          pArr[i * 3 + 2] = pt.z + (Math.cos(elapsed * 2.0 + i) * 0.05);
        }
        pulseGeo.attributes.position.needsUpdate = true;

        controls.update();

        // Project 3D landmark pins to 2D screen coordinates
        const coords = LANDMARK_PINS.map((pin) => {
          const worldPos = new THREE.Vector3(...pin.coords);
          worldPos.applyMatrix4(modelRoot.matrixWorld);
          const screenPos = worldPos.clone().project(camera);
          const x = ((screenPos.x + 1) * width) / 2;
          const y = ((-screenPos.y + 1) * height) / 2;
          const visible = screenPos.z < 1.0 && x >= 0 && x <= width && y >= 0 && y <= height;
          return { id: pin.id, x, y, visible };
        });
        setPinScreenCoords(coords);

        renderer.render(scene, camera);
      };

      animate();

      const handleResize = () => {
        if (!container) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animId);
        controls.dispose();
        renderer.dispose();
        container.innerHTML = '';
      };
    };

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const cleanup = init(width, height);

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  if (!webglSupported) {
    return (
      <div className={`p-8 rounded-panel bg-[#1F2022] border border-white/10 text-center ${className}`}>
        <p className="text-xs text-amber-200/80 font-mono">
          WebGL hardware acceleration unavailable. 3D Human Nervous System fallback active.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full min-h-[560px] select-none overflow-hidden rounded-panel bg-[#1F2022] ${className}`}>
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Numbered landmark badges */}
      {pinScreenCoords.map((coord) => {
        const pin = LANDMARK_PINS.find((p) => p.id === coord.id);
        if (!pin || !coord.visible) return null;
        const isSel = activePin?.id === pin.id;
        const isHov = hoveredPin?.id === pin.id;
        return (
          <button
            key={pin.id}
            onClick={() => setActivePin(pin)}
            onMouseEnter={() => setHoveredPin(pin)}
            onMouseLeave={() => setHoveredPin(null)}
            style={{ left: `${coord.x}px`, top: `${coord.y}px`, transform: 'translate(-50%, -50%)' }}
            className={`absolute z-20 w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-xs transition-all shadow-lg ${
              isSel
                ? 'bg-white text-forest scale-125 ring-2 ring-emerald-400'
                : isHov
                ? 'bg-emerald-100 text-forest border-2 border-white scale-110'
                : 'bg-black/75 text-emerald-200 border border-white/20 hover:scale-110'
            }`}
            title={pin.name}
          >
            {pin.label}
          </button>
        );
      })}

      {/* Top Left Title Overlay */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none space-y-1.5 font-mono text-[10px]">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 border border-white/10 shadow-sm text-emerald-300 backdrop-blur-sm">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="font-bold tracking-wider">FULL HUMAN NERVOUS SYSTEM &mdash; CNS &amp; PNS</span>
        </div>
        <div className="px-3 py-1 rounded-full bg-black/50 text-slate-200/80 border border-white/5 shadow-sm backdrop-blur-xs">
          CEREBRAL CORTEX &bull; CENTRAL SPINAL AXIS &bull; PERIPHERAL NERVE CONDUITS
        </div>
      </div>

      {/* Camera Views & Orbit Controls Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex flex-wrap items-center gap-1.5 p-1 rounded-full bg-black/60 border border-white/10 shadow-sm backdrop-blur-md font-mono text-[10px]">
        <button
          onClick={() => setCameraView('front')}
          className="px-2.5 py-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors font-medium"
          title="Frontal Coronal Perspective"
        >
          Front
        </button>
        <button
          onClick={() => setCameraView('back')}
          className="px-2.5 py-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors font-medium"
          title="Posterior Spinal Perspective"
        >
          Back
        </button>
        <button
          onClick={() => setCameraView('head')}
          className="px-2.5 py-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors font-medium"
          title="Cranial CNS Zoom"
        >
          Head
        </button>
        <button
          onClick={() => setCameraView('reset')}
          className="px-2.5 py-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors font-medium"
          title="Reset Anatomical Orbit"
        >
          Reset
        </button>
        <span className="w-px h-3 bg-white/20 mx-0.5" />
        <button
          onClick={() => setIsRotating(!isRotating)}
          className={`px-3 py-1 rounded-full font-semibold transition-all ${
            isRotating
              ? 'bg-white text-forest shadow-xs'
              : 'bg-white/10 text-emerald-300 border border-white/10'
          }`}
        >
          {isRotating ? '⏸ Rotating' : '▶ Auto-Rotate'}
        </button>
      </div>

      {/* Landmark inspector card */}
      {activePin && (
        <div className="absolute bottom-4 left-4 right-4 z-20 p-4 rounded-card bg-black/85 border border-white/15 shadow-2xl backdrop-blur-md font-sans text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
          <div className="space-y-1 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-white text-forest font-extrabold flex items-center justify-center text-[10px] font-mono">
                {activePin.label}
              </span>
              <span className="text-white font-serif font-bold text-sm tracking-wide">{activePin.name}</span>
              <span className="text-[10px] text-emerald-300 font-mono bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                {activePin.category}
              </span>
            </div>
            <p className="text-xs font-sans text-white/80 leading-relaxed">{activePin.finding}</p>
          </div>

          {onTransitionToBrain && (
            <button
              onClick={onTransitionToBrain}
              className="px-4 py-2 rounded-full bg-white text-forest font-serif font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm hover:bg-slate-100 flex-shrink-0"
            >
              <Brain className="w-4 h-4 text-forest" />
              <span>Inspect Digital Brain &rarr;</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default HumanBody3D;
