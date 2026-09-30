// --- TUNABLE CONSTANTS ---
// Mode 0: Ink Bloom
const float NOISE_SCALE = 2.0; 
const float NOISE_STRENGTH = 0.5;
const float EDGE_SOFTNESS = 0.35;
const float EDGE_WIDTH = 0.06;
const float DISTORTION_AMOUNT = 0.07;
const float NOISE_SPEED = 0.5;

// Mode 1: RGB Split
const float RGB_OFFSET_MULT = 0.03;
const float RGB_WAVE_FREQ = 10.0;
const float RGB_WAVE_AMP = 0.05;

// Mode 2: Slice Shutter
const float SLICE_COUNT = 10.0;
const float SLICE_DELAY_MULT = 0.06;
const float SLICE_GAP = 0.005;

// Mode 3: Pixel Mosaic
const float MOSAIC_COLS = 24.0;
const float MOSAIC_EDGE_BRIGHTNESS = 1.5;

// Mode 4: Zoom Blur
const int ZOOM_SAMPLES = 8;
const float ZOOM_MAX_SCALE1 = 1.4;
const float ZOOM_MAX_SCALE2 = 1.3;

// --- UNIFORMS ---
uniform sampler2D uTex1;       // Current image
uniform sampler2D uTex2;       // Next image
uniform float uProgress;       // Transition progress (0.0 to 1.0)
uniform float uTime;           // Elapsed time in seconds
uniform vec2 uOrigin;          // Click position in UV space (0.0 to 1.0)
uniform vec2 uResolution;      // Canvas resolution in pixels
uniform vec2 uImageRes1;       // Resolution of the current image
uniform vec2 uImageRes2;       // Resolution of the next image
uniform float uMode;           // 0 to 4 for the transition mode

// --- VARYINGS ---
varying vec2 vUv;

// --- HELPER FUNCTIONS ---

// Hash function for random value generation
float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

// Value noise implementation
float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    float a = hash(i + vec2(0.0, 0.0));
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Fractal Brownian Motion (FBM)
float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 4; i++) {
        value += amplitude * vnoise(p * frequency);
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    return value;
}

// Computes UV coordinates for 'fit height' behavior
// Always matches the image height to screen height, and scales width proportionally.
vec2 coverUV(vec2 uv, vec2 screenRes, vec2 imageRes) {
    float screenAspect = screenRes.x / screenRes.y;
    float imageAspect = imageRes.x / imageRes.y;
    float scaleX = screenAspect / imageAspect;
    return vec2((uv.x - 0.5) * scaleX + 0.5, uv.y);
}

// Safely samples texture with bounds checking to avoid stretched edge pixels (draws black bars instead)
vec4 sampleTex(sampler2D tex, vec2 uv) {
    vec4 c = texture2D(tex, uv);
    float bounds = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
    return c * bounds;
}

void main() {
    vec3 finalColor = vec3(0.0);
    int mode = int(uMode + 0.5);
    
    if (mode == 0) {
        // --- 0. INK BLOOM ---
        // Creates an organic, spreading distance field from the origin using FBM noise.
        // It smoothly transitions from old to new image, with edge distortion and glowing rim.
        
        float aspect = uResolution.x / uResolution.y;
        vec2 aspectUv = vUv;
        aspectUv.x *= aspect;
        vec2 aspectOrigin = uOrigin;
        aspectOrigin.x *= aspect;
        
        float dist = distance(aspectUv, aspectOrigin);
        float maxDist = length(vec2(aspect, 1.0));
        
        vec2 noiseUv = vUv * NOISE_SCALE + uTime * NOISE_SPEED;
        float noiseVal = fbm(noiseUv);
        
        float field = dist + (noiseVal - 0.5) * NOISE_STRENGTH;
        
        float minField = -NOISE_STRENGTH * 0.5;
        float maxField = maxDist + NOISE_STRENGTH * 0.5;
        float startThreshold = minField;
        float endThreshold = maxField + EDGE_SOFTNESS + EDGE_WIDTH;
        float threshold = mix(startThreshold, endThreshold, uProgress);
        
        float mask = 1.0 - smoothstep(threshold - EDGE_SOFTNESS, threshold, field);
        
        float edgeBand = smoothstep(threshold - EDGE_SOFTNESS - EDGE_WIDTH, threshold, field) 
                       - smoothstep(threshold, threshold + EDGE_SOFTNESS, field);
        float progressFade = smoothstep(0.0, 0.1, uProgress) * smoothstep(1.0, 0.9, uProgress);
        
        vec2 distortion = vec2(fbm(noiseUv + 12.3) - 0.5, fbm(noiseUv + 78.9) - 0.5) * DISTORTION_AMOUNT * edgeBand * progressFade;
        
        vec2 uv1 = coverUV(vUv + distortion, uResolution, uImageRes1);
        vec2 uv2 = coverUV(vUv + distortion, uResolution, uImageRes2);
        
        vec4 color1 = sampleTex(uTex1, uv1);
        vec4 color2 = sampleTex(uTex2, uv2);
        
        float rimDark = smoothstep(threshold - EDGE_WIDTH, threshold, field) 
                      - smoothstep(threshold, threshold + EDGE_WIDTH, field);
        float highlight = smoothstep(threshold - EDGE_SOFTNESS, threshold - EDGE_SOFTNESS + EDGE_WIDTH, field) 
                        - smoothstep(threshold - EDGE_SOFTNESS + EDGE_WIDTH, threshold, field);
        
        finalColor = mix(color1.rgb, color2.rgb, mask);
        finalColor -= vec3(rimDark * 0.5) * progressFade;
        finalColor += vec3(highlight * 0.3) * progressFade;
        
    } else if (mode == 1) {
        // --- 1. RGB SPLIT ---
        // Samples R, G, B channels with separating offsets that peak mid-transition.
        // Also applies a sine wave distortion on the Y axis.
        vec2 dir = normalize(vUv - uOrigin);
        if (length(vUv - uOrigin) < 0.001) dir = vec2(1.0, 0.0); // fallback for exactly origin
        
        float peak = sin(uProgress * 3.14159265);
        float offsetStr = peak * RGB_OFFSET_MULT;
        
        vec2 waveUv = vUv;
        waveUv.y += sin(vUv.x * RGB_WAVE_FREQ + uTime) * RGB_WAVE_AMP * peak;
        
        vec2 uvR = coverUV(waveUv + dir * offsetStr, uResolution, uImageRes1);
        vec2 uvG = coverUV(waveUv, uResolution, uImageRes1);
        vec2 uvB = coverUV(waveUv - dir * offsetStr, uResolution, uImageRes1);
        
        float r1 = sampleTex(uTex1, uvR).r;
        float g1 = sampleTex(uTex1, uvG).g;
        float b1 = sampleTex(uTex1, uvB).b;
        vec3 c1 = vec3(r1, g1, b1);
        
        vec2 uvR2 = coverUV(waveUv + dir * offsetStr, uResolution, uImageRes2);
        vec2 uvG2 = coverUV(waveUv, uResolution, uImageRes2);
        vec2 uvB2 = coverUV(waveUv - dir * offsetStr, uResolution, uImageRes2);
        
        float r2 = sampleTex(uTex2, uvR2).r;
        float g2 = sampleTex(uTex2, uvG2).g;
        float b2 = sampleTex(uTex2, uvB2).b;
        vec3 c2 = vec3(r2, g2, b2);
        
        float mask = smoothstep(0.4, 0.6, uProgress);
        finalColor = mix(c1, c2, mask);
        
    } else if (mode == 2) {
        // --- 2. SLICE SHUTTER ---
        // Divides the screen into vertical strips. The old image slides upwards.
        // Strips are delayed based on their X index, creating a staggering shutter effect.
        float stripIndex = floor(vUv.x * SLICE_COUNT);
        float stripFract = fract(vUv.x * SLICE_COUNT);
        
        // Gap between strips
        float gapMask = step(SLICE_GAP, stripFract) * step(stripFract, 1.0 - SLICE_GAP);
        
        // Progress for this specific strip
        float sProg = clamp((uProgress * 1.6) - stripIndex * SLICE_DELAY_MULT, 0.0, 1.0);
        sProg = smoothstep(0.0, 1.0, sProg);
        
        // Slide old image up
        vec2 uvOld = vUv;
        uvOld.y -= sProg;
        
        vec2 cuv1 = coverUV(uvOld, uResolution, uImageRes1);
        vec2 cuv2 = coverUV(vUv, uResolution, uImageRes2);
        
        vec4 color1 = sampleTex(uTex1, cuv1);
        vec4 color2 = sampleTex(uTex2, cuv2);
        
        // Show old if it hasn't completely slid off the bottom bounds (uvOld.y > 0)
        float showOld = step(0.0, uvOld.y);
        finalColor = mix(color2.rgb, color1.rgb, showOld) * gapMask;
        
    } else if (mode == 3) {
        // --- 3. PIXEL MOSAIC ---
        // Grid cells flip independently based on a hash value.
        // UVs slightly pixelate right as the cell flips, with a brightness flash.
        vec2 gridRes = vec2(MOSAIC_COLS, floor(MOSAIC_COLS * (uResolution.y / uResolution.x)));
        vec2 gridUv = vUv * gridRes;
        vec2 cell = floor(gridUv);
        
        float cellHash = hash(cell);
        // Local progress around this cell's hash
        float localProg = clamp((uProgress - cellHash * 0.8) / 0.2, 0.0, 1.0);
        
        vec2 cellCenter = (cell + 0.5) / gridRes;
        float pixelStrength = sin(localProg * 3.14159) * 0.5; // peaks at 0.5 when transitioning
        vec2 pUv = mix(vUv, cellCenter, pixelStrength);
        
        vec2 cuv1 = coverUV(pUv, uResolution, uImageRes1);
        vec2 cuv2 = coverUV(pUv, uResolution, uImageRes2);
        
        vec3 c1 = sampleTex(uTex1, cuv1).rgb;
        vec3 c2 = sampleTex(uTex2, cuv2).rgb;
        
        // Sharp flip
        float flip = step(cellHash, uProgress);
        finalColor = mix(c1, c2, flip);
        
        // Edge glow when transitioning
        float edgeGlow = sin(localProg * 3.14159) * MOSAIC_EDGE_BRIGHTNESS;
        finalColor += vec3(edgeGlow) * 0.1; // scale down brightness a bit
        
    } else if (mode == 4) {
        // --- 4. ZOOM BLUR ---
        // Radial blur effect where the old image zooms in and new zooms out.
        // The blur strength peaks at 50% transition.
        float scale1 = mix(1.0, ZOOM_MAX_SCALE1, uProgress);
        float scale2 = mix(ZOOM_MAX_SCALE2, 1.0, uProgress);
        
        vec2 toCenter = vec2(0.5) - vUv;
        float blurStr = sin(uProgress * 3.14159) * 0.05;
        
        vec3 c1 = vec3(0.0);
        vec3 c2 = vec3(0.0);
        
        for (int i = 0; i < ZOOM_SAMPLES; i++) {
            float f = float(i) / float(ZOOM_SAMPLES - 1);
            vec2 offset = toCenter * (f - 0.5) * blurStr;
            
            vec2 uvS1 = (vUv + offset - 0.5) / scale1 + 0.5;
            vec2 uvS2 = (vUv + offset - 0.5) / scale2 + 0.5;
            
            c1 += sampleTex(uTex1, coverUV(uvS1, uResolution, uImageRes1)).rgb;
            c2 += sampleTex(uTex2, coverUV(uvS2, uResolution, uImageRes2)).rgb;
        }
        
        c1 /= float(ZOOM_SAMPLES);
        c2 /= float(ZOOM_SAMPLES);
        
        float fade = smoothstep(0.3, 0.7, uProgress);
        finalColor = mix(c1, c2, fade);
    }
    
    gl_FragColor = vec4(finalColor, 1.0);
}
