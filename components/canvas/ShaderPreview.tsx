"use client";

import React, { useEffect, useRef, useState } from "react";

type ShaderMode = "none" | "breathing1" | "breathing2" | "breathing3" | "breathing4" | "warp" | "zenglow";

interface ShaderPreviewProps {
  roomImage: string;
  shaderMode: ShaderMode;
  width?: number;
  height?: number;
  breathDuration?: number;
  breathIntensity?: number;
}

// Vertex shader (same for all shaders)
const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

// Fragment shaders for each mode
const fragmentShaders: Record<ShaderMode, string> = {
  none: `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_time;
    varying vec2 v_texCoord;
    
    void main() {
      gl_FragColor = texture2D(u_texture, v_texCoord);
    }
  `,
  breathing1: `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_time;
    uniform float u_strength;
    uniform float u_oscillation;
    varying vec2 v_texCoord;
    
    void main() {
      float breathing = sin(u_time * u_oscillation) * u_strength;
      vec2 center = vec2(0.5, 0.5);
      vec2 offset = (v_texCoord - center) * (1.0 + breathing);
      vec2 newUV = center + offset;
      gl_FragColor = texture2D(u_texture, newUV);
    }
  `,
  breathing2: `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_time;
    uniform float u_strength;
    uniform float u_oscillation;
    varying vec2 v_texCoord;
    
    void main() {
      float breathing = sin(u_time * u_oscillation) * u_strength;
      float pulse = sin(u_time * u_oscillation * 2.0) * 0.1 + 1.0;
      vec2 center = vec2(0.5, 0.5);
      vec2 offset = (v_texCoord - center) * (1.0 + breathing);
      vec2 newUV = center + offset;
      vec4 color = texture2D(u_texture, newUV);
      color.rgb *= pulse;
      gl_FragColor = color;
    }
  `,
  breathing3: `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_time;
    uniform float u_strength;
    uniform float u_oscillation;
    varying vec2 v_texCoord;
    
    void main() {
      float breathing = sin(u_time * u_oscillation) * u_strength;
      float pulse = sin(u_time * u_oscillation * 1.5) * 0.15 + 1.0;
      vec2 center = vec2(0.5, 0.5);
      vec2 offset = (v_texCoord - center) * (1.0 + breathing * 1.2);
      vec2 newUV = center + offset;
      vec4 color = texture2D(u_texture, newUV);
      color.rgb *= pulse;
      color.rgb *= 1.05; // Slight brightness boost
      gl_FragColor = color;
    }
  `,
  breathing4: `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_time;
    uniform float u_strength;
    uniform float u_oscillation;
    uniform float u_exposure;
    uniform float u_lightPulse;
    varying vec2 v_texCoord;
    
    void main() {
      float breathing = sin(u_time * u_oscillation) * u_strength;
      vec2 center = vec2(0.5, 0.5);
      vec2 offset = (v_texCoord - center) * (1.0 + breathing);
      vec2 newUV = center + offset;
      float pulse = sin(u_time * u_lightPulse) * 0.1 + 1.0;
      vec4 color = texture2D(u_texture, newUV);
      color.rgb *= u_exposure * pulse;
      gl_FragColor = color;
    }
  `,
  warp: `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_time;
    varying vec2 v_texCoord;
    
    void main() {
      vec2 uv = v_texCoord;
      float wave = sin(uv.y * 10.0 + u_time * 2.0) * 0.02;
      uv.x += wave;
      vec4 color = texture2D(u_texture, uv);
      gl_FragColor = color;
    }
  `,
  zenglow: `
    precision mediump float;
    uniform sampler2D u_texture;
    uniform float u_time;
    uniform float u_strength;
    uniform float u_oscillation;
    varying vec2 v_texCoord;
    
    void main() {
      float breathing = sin(u_time * u_oscillation) * u_strength * 0.5;
      vec2 center = vec2(0.5, 0.5);
      vec2 offset = (v_texCoord - center) * (1.0 + breathing);
      vec2 newUV = center + offset;
      vec4 color = texture2D(u_texture, newUV);
      
      // Soft glow effect
      float dist = distance(v_texCoord, center);
      float glow = 1.0 - smoothstep(0.3, 0.8, dist);
      color.rgb += glow * 0.15;
      color.rgb *= 1.1;
      
      gl_FragColor = color;
    }
  `,
};

export const ShaderPreview: React.FC<ShaderPreviewProps> = ({
  roomImage,
  shaderMode,
  width = 640,
  height = 360,
  breathDuration = 4,
  breathIntensity = 0.02,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Load image
  useEffect(() => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.src = roomImage;
    i.onload = () => setImg(i);
  }, [roomImage]);

  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.error("WebGL not supported");
      return;
    }

    glRef.current = gl;

    // Create shader
    const createShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    // Create program
    const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaders[shaderMode]);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      return;
    }

    programRef.current = program;

    // Setup geometry
    const positions = new Float32Array([
      -1, -1, 0, 1,
       1, -1, 1, 1,
      -1,  1, 0, 0,
       1,  1, 1, 0,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLoc = gl.getAttribLocation(program, "a_position");
    const texCoordLoc = gl.getAttribLocation(program, "a_texCoord");

    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 16, 8);

    // Create texture
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    textureRef.current = texture;

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteTexture(texture);
    };
  }, [shaderMode]);

  // Update texture and render
  useEffect(() => {
    if (!img || !glRef.current || !programRef.current || !textureRef.current) return;

    const gl = glRef.current;
    const program = programRef.current;

    gl.bindTexture(gl.TEXTURE_2D, textureRef.current);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);

    const render = () => {
      if (!glRef.current || !programRef.current) return;

      const gl = glRef.current;
      const program = programRef.current;

      gl.useProgram(program);
      gl.viewport(0, 0, width, height);

      // Set uniforms
      const timeLoc = gl.getUniformLocation(program, "u_time");
      const strengthLoc = gl.getUniformLocation(program, "u_strength");
      const oscillationLoc = gl.getUniformLocation(program, "u_oscillation");
      const exposureLoc = gl.getUniformLocation(program, "u_exposure");
      const lightPulseLoc = gl.getUniformLocation(program, "u_lightPulse");

      const currentTime = (Date.now() - startTimeRef.current) / 1000;
      if (timeLoc) gl.uniform1f(timeLoc, currentTime);
      if (strengthLoc) gl.uniform1f(strengthLoc, breathIntensity * 0.023);
      if (oscillationLoc) gl.uniform1f(oscillationLoc, 1.0 / breathDuration);
      if (exposureLoc) gl.uniform1f(exposureLoc, 1.02);
      if (lightPulseLoc) gl.uniform1f(lightPulseLoc, 0.3 * 0.045);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [img, shaderMode, width, height, breathDuration, breathIntensity]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="w-full h-full rounded-lg"
      style={{ imageRendering: "auto" }}
    />
  );
};

