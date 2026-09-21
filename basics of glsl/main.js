import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import gsap from 'gsap';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';

// 1. Setup Scene, Camera, and Renderer
const canvas = document.querySelector('#webgl-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 3.8;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// 2. Post-Processing (Refined Bloom)
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.65;
bloomPass.strength = 0.8;
bloomPass.radius = 0.5;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

// 3. Create Geometry and Custom ShaderMaterial
const geometry = new THREE.IcosahedronGeometry(1.5, 128);
const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0, 0) },
    // Liquid Onyx & Gold default theme
    uColor1: { value: new THREE.Color('#0a0a0a') },
    uColor2: { value: new THREE.Color('#cca677') }
  },
  wireframe: false
});

const mesh = new THREE.Mesh(geometry, material);
const group = new THREE.Group();
group.add(mesh);
scene.add(group);

// 4. Handle Resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// 5. GSAP Interactivity & Animations
// Create highly performant GSAP quickTo functions for mouse tracking
const xTo = gsap.quickTo(group.rotation, "y", { duration: 1.5, ease: "power3.out" });
const yTo = gsap.quickTo(group.rotation, "x", { duration: 1.5, ease: "power3.out" });

window.addEventListener('mousemove', (event) => {
  const normalizedX = (event.clientX / window.innerWidth) * 2 - 1;
  const normalizedY = -(event.clientY / window.innerHeight) * 2 + 1;
  
  // Animate the group rotation smoothly towards mouse
  xTo(normalizedX * 0.5);
  yTo(-normalizedY * 0.5);
});

// Add a continuous, elegant "breathing" animation to the scale
gsap.to(group.scale, {
  x: 1.05,
  y: 1.05,
  z: 1.05,
  duration: 4,
  yoyo: true,
  repeat: -1,
  ease: "sine.inOut"
});

// Refined color palettes on click
const palettes = [
  ['#0a0a0a', '#cca677'], // Onyx & Gold
  ['#050814', '#4568dc'], // Deep Ocean Blue
  ['#111111', '#cccccc'], // Silver Chrome
  ['#1a0b1c', '#ff5e62']  // Dark Velvet
];
let paletteIndex = 0;

window.addEventListener('click', () => {
  paletteIndex = (paletteIndex + 1) % palettes.length;
  const c1 = new THREE.Color(palettes[paletteIndex][0]);
  const c2 = new THREE.Color(palettes[paletteIndex][1]);

  gsap.to(material.uniforms.uColor1.value, {
    r: c1.r, g: c1.g, b: c1.b,
    duration: 2.0, ease: "power2.inOut"
  });

  gsap.to(material.uniforms.uColor2.value, {
    r: c2.r, g: c2.g, b: c2.b,
    duration: 2.0, ease: "power2.inOut"
  });
  
  // Add a subtle bump effect on click
  gsap.fromTo(group.scale, 
    { x: 1.1, y: 1.1, z: 1.1 },
    { x: 1.0, y: 1.0, z: 1.0, duration: 1.5, ease: "elastic.out(1, 0.3)" }
  );
});

// 6. Animation Loop
const clock = new THREE.Clock();

function animate() {
  const elapsedTime = clock.getElapsedTime();

  // Update time for the shader
  material.uniforms.uTime.value = elapsedTime;
  
  // Slow base rotation applies to the mesh itself
  mesh.rotation.y = elapsedTime * 0.05;
  mesh.rotation.x = elapsedTime * 0.05;

  composer.render();
  requestAnimationFrame(animate);
}

animate();
