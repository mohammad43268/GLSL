uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);

    // Light 1: Key Light (Top Right, creates sharp specular highlights)
    vec3 lightDir1 = normalize(vec3(1.0, 1.0, 1.0));
    float diff1 = max(dot(normal, lightDir1), 0.0);
    
    // Specular for Key Light (Glossy shine)
    vec3 halfVector1 = normalize(lightDir1 + viewDir);
    float spec1 = pow(max(dot(normal, halfVector1), 0.0), 64.0);

    // Light 2: Fill Light (Bottom Left, softer secondary illumination)
    vec3 lightDir2 = normalize(vec3(-1.0, -0.5, 1.0));
    float diff2 = max(dot(normal, lightDir2), 0.0) * 0.6; 

    // Base Ambient Color (Very dark onyx)
    vec3 ambient = mix(uColor1, vec3(0.02), 0.85);

    // Fresnel (Rim lighting for the edges)
    float fresnel = 1.0 - max(dot(viewDir, normal), 0.0);
    float fresnelGlow = pow(fresnel, 4.0);
    
    // Combine Lighting Components
    vec3 keyContribution = (uColor1 * diff1 * 0.5) + (vec3(1.0) * spec1 * 0.6); // Diffuse + Specular
    vec3 fillContribution = uColor2 * diff2; // Soft colored fill
    vec3 rimContribution = uColor2 * fresnelGlow * 1.2; // Glowing edges

    vec3 finalColor = ambient + keyContribution + fillContribution + rimContribution;

    gl_FragColor = vec4(finalColor, 1.0);
}
