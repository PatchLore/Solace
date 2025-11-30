// Breathing Shader v4
// Uniforms: u_time, u_strength, u_oscillation, u_exposure, u_lightPulse

#ifdef GL_ES
precision mediump float;
#endif

uniform float u_time;
uniform float u_strength;
uniform float u_oscillation;
uniform float u_exposure;
uniform float u_lightPulse;

uniform sampler2D u_texture;
uniform vec2 u_resolution;

varying vec2 v_texCoord;

void main() {
    vec2 uv = v_texCoord;
    
    // Breathing effect - subtle zoom based on time
    float breathing = sin(u_time * u_oscillation) * u_strength;
    vec2 center = vec2(0.5, 0.5);
    vec2 offset = (uv - center) * (1.0 + breathing);
    vec2 newUV = center + offset;
    
    // Light pulse effect
    float pulse = sin(u_time * u_lightPulse) * 0.1 + 1.0;
    
    // Sample texture with breathing transform
    vec4 color = texture2D(u_texture, newUV);
    
    // Apply exposure and light pulse
    color.rgb *= u_exposure * pulse;
    
    gl_FragColor = color;
}
