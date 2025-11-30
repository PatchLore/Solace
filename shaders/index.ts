// Shader paths for FFmpeg (relative to public directory)
export const SHADER_PATHS = {
  breathing4: '/shaders/breathing4.glsl',
} as const;

export type ShaderId = keyof typeof SHADER_PATHS;

// Shader uniform definitions
export interface ShaderUniforms {
  u_time: number;
  u_strength: number;
  u_oscillation: number;
  u_exposure: number;
  u_lightPulse: number;
}

