uniform float uIntensity;
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;

varying vec2 vUv;
varying float vDistortion;

void main() {
    float distortMix = smoothstep(-0.2, 0.2, vDistortion * uIntensity);
    vec3 color = mix(uColor1, uColor2, distortMix);
    color += vec3(vDistortion * 0.1);
    gl_FragColor = vec4(color, 1.0);
}
