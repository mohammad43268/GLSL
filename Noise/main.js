import * as THREE from 'three';
import { gsap } from 'gsap';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';

const container = document.getElementById('canvas-container');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 2;

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

const geometry = new THREE.PlaneGeometry(8, 8, 256, 256);

const color1 = new THREE.Color('#100524');
const color2 = new THREE.Color('#ff2a5f');

const uniforms = {
  uTime: { value: 0 },
  uSpeed: { value: 0.2 },
  uNoiseDensity: { value: 1.5 },
  uNoiseStrength: { value: 0.3 },
  uIntensity: { value: 1.0 },
  uColor1: { value: color1 },
  uColor2: { value: color2 },
};

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms,
  wireframe: false,
});

const mesh = new THREE.Mesh(geometry, material);
mesh.rotation.x = -Math.PI * 0.1; 
mesh.rotation.z = Math.PI * 0.1;
scene.add(mesh);

const clock = new THREE.Clock();

function animate() {
  const elapsedTime = clock.getElapsedTime();
  
  material.uniforms.uTime.value = elapsedTime;

  mesh.rotation.x = -Math.PI * 0.1 + Math.sin(elapsedTime * 0.2) * 0.05;
  mesh.rotation.y = Math.sin(elapsedTime * 0.15) * 0.05;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

const tl = gsap.timeline();

gsap.set('.nav', { y: -50, opacity: 0 });
gsap.set('.hero-title', { y: 100, opacity: 0 });
gsap.set('.hero-subtitle', { y: 30, opacity: 0 });
gsap.set('.hero-cta', { y: 30, opacity: 0 });
gsap.set('.controls', { x: 50, opacity: 0 });

gsap.fromTo(material.uniforms.uNoiseStrength, 
  { value: 0.0 }, 
  { value: 0.3, duration: 2.5, ease: 'power3.inOut' }
);
gsap.fromTo(camera.position,
  { z: 4 },
  { z: 2, duration: 2.5, ease: 'power3.inOut' }
);

tl.to('.nav', { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, 1.0)
  .to('.hero-title', { y: 0, opacity: 1, duration: 1, ease: 'power4.out' }, 1.2)
  .to('.hero-subtitle', { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, 1.4)
  .to('.hero-cta', { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }, 1.5)
  .to('.controls', { x: 0, opacity: 1, duration: 1, ease: 'power3.out' }, 1.6);

const exploreBtn = document.getElementById('explore-btn');

exploreBtn.addEventListener('mouseenter', () => {
  gsap.to(material.uniforms.uSpeed, { value: 0.8, duration: 0.8, ease: 'power2.out' });
  gsap.to(material.uniforms.uNoiseDensity, { value: 2.0, duration: 0.8, ease: 'power2.out' });
  gsap.to(material.uniforms.uNoiseStrength, { value: 0.5, duration: 0.8, ease: 'power2.out' });
});

exploreBtn.addEventListener('mouseleave', () => {
  const currentSpeed = parseFloat(document.getElementById('speed-slider').value);
  gsap.to(material.uniforms.uSpeed, { value: currentSpeed, duration: 1.5, ease: 'power2.out' });
  gsap.to(material.uniforms.uNoiseDensity, { value: 1.5, duration: 1.5, ease: 'power2.out' });
  gsap.to(material.uniforms.uNoiseStrength, { value: 0.3, duration: 1.5, ease: 'power2.out' });
});

const speedSlider = document.getElementById('speed-slider');
speedSlider.addEventListener('input', (e) => {
  material.uniforms.uSpeed.value = parseFloat(e.target.value);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
