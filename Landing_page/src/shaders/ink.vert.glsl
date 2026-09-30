// Standard vertex shader for full-screen plane
varying vec2 vUv;

void main() {
  // Pass UVs to fragment shader
  vUv = uv;
  
  // Standard projection
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
