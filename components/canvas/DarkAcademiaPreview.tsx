"use client";

import { useEffect, useRef, useState } from "react";
import type { DarkAcademiaConfig } from "@/app/types";

interface DarkAcademiaPreviewProps {
  config: DarkAcademiaConfig;
  isPlaying?: boolean;
}

export default function DarkAcademiaPreview({
  config,
  isPlaying = true,
}: DarkAcademiaPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; size: number }>>([]);

  // Initialize dust particles
  useEffect(() => {
    if (config.dustParticles) {
      const particles: Array<{ x: number; y: number; vx: number; vy: number; size: number }> = [];
      for (let i = 0; i < 30; i++) {
        particles.push({
          x: Math.random() * 1920,
          y: Math.random() * 1080,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 1,
        });
      }
      particlesRef.current = particles;
    }
  }, [config.dustParticles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1920;
    canvas.height = 1080;

    // Load room image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = config.roomImage;
    img.onload = () => {
      imageRef.current = img;
    };
    img.onerror = () => {
      // Create a fallback colored rectangle if image fails to load
      const fallback = document.createElement("canvas");
      fallback.width = 1920;
      fallback.height = 1080;
      const fallbackCtx = fallback.getContext("2d");
      if (fallbackCtx) {
        fallbackCtx.fillStyle = "#1a0f0a";
        fallbackCtx.fillRect(0, 0, 1920, 1080);
        fallbackCtx.fillStyle = "#8b6f47";
        fallbackCtx.font = "48px Arial";
        fallbackCtx.textAlign = "center";
        fallbackCtx.fillText("Dark Academia room image not found", 960, 540);
        const fallbackImg = new Image();
        fallbackImg.src = fallback.toDataURL();
        fallbackImg.onload = () => {
          imageRef.current = fallbackImg;
        };
      }
    };

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [config.roomImage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isPlaying) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      if (!imageRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const now = Date.now();
      const elapsed = (now - startTimeRef.current) / 1000;

      // Candle flicker - irregular pattern
      const flicker1 = Math.sin(elapsed * 8) * 0.3;
      const flicker2 = Math.sin(elapsed * 13) * 0.2;
      const flicker3 = Math.sin(elapsed * 5) * 0.1;
      const flicker = (flicker1 + flicker2 + flicker3) / 3;
      const brightnessMultiplier = 1.0 + flicker * config.flickerIntensity * 0.15;

      // Warmth shift (orange/gold tones)
      const warmth = config.warmthShift;

      // Camera drift
      const driftSpeed = 0.0001;
      const driftX = Math.sin(elapsed * driftSpeed) * config.ambientMotion * 10;
      const driftY = Math.cos(elapsed * driftSpeed * 0.7) * config.ambientMotion * 10;
      const zoom = 1.0 + Math.sin(elapsed * driftSpeed * 0.5) * config.ambientMotion * 0.005;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Save context
      ctx.save();

      // Apply camera drift and zoom
      ctx.translate(canvas.width / 2 + driftX, canvas.height / 2 + driftY);
      ctx.scale(zoom, zoom);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // Apply brightness (flicker)
      ctx.globalAlpha = brightnessMultiplier;

      // Draw image with proper aspect ratio
      const img = imageRef.current;
      const imgAspect = img.width / img.height;
      const canvasAspect = canvas.width / canvas.height;

      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let drawX = 0;
      let drawY = 0;

      if (imgAspect > canvasAspect) {
        drawHeight = canvas.height;
        drawWidth = img.width * (canvas.height / img.height);
        drawX = (canvas.width - drawWidth) / 2;
      } else {
        drawWidth = canvas.width;
        drawHeight = img.height * (canvas.width / img.width);
        drawY = (canvas.height - drawHeight) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

      // Apply warm color overlay
      if (warmth > 0) {
        ctx.globalCompositeOperation = "overlay";
        ctx.fillStyle = `rgba(255, 200, 100, ${warmth * 0.2})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "source-over";
      }

      // Apply vignette
      if (config.vignetteStrength > 0) {
        const gradient = ctx.createRadialGradient(
          canvas.width / 2,
          canvas.height / 2,
          0,
          canvas.width / 2,
          canvas.height / 2,
          Math.max(canvas.width, canvas.height) * 0.7
        );
        gradient.addColorStop(0, "rgba(0,0,0,0)");
        gradient.addColorStop(1, `rgba(0,0,0,${config.vignetteStrength * 0.5})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Draw dust particles
      if (config.dustParticles && particlesRef.current.length > 0) {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        particlesRef.current.forEach((particle) => {
          // Update particle position
          particle.x += particle.vx;
          particle.y += particle.vy;

          // Wrap around edges
          if (particle.x < 0) particle.x = canvas.width;
          if (particle.x > canvas.width) particle.x = 0;
          if (particle.y < 0) particle.y = canvas.height;
          if (particle.y > canvas.height) particle.y = 0;

          // Draw particle
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1.0;
      }

      // Draw quotes if enabled
      if (config.showQuotes && config.quoteList && config.quoteList.length > 0) {
        const quoteInterval = config.quoteIntervalSeconds || 30;
        const currentQuoteIndex = Math.floor(elapsed / quoteInterval) % config.quoteList.length;
        const quoteStartTime = currentQuoteIndex * quoteInterval;
        const quoteElapsed = elapsed - quoteStartTime;
        const fadeTime = 1; // 1 second fade

        if (quoteElapsed >= 0 && quoteElapsed < fadeTime + 3) {
          let alpha = 1;
          if (quoteElapsed < fadeTime) {
            alpha = quoteElapsed / fadeTime; // Fade in
          } else if (quoteElapsed > 3) {
            alpha = 1 - (quoteElapsed - 3) / fadeTime; // Fade out
          }

          const quote = config.quoteList[currentQuoteIndex];
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = "#FFF8E7";
          ctx.font = "48px serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;

          // Word wrap
          const words = quote.split(" ");
          const lineHeight = 60;
          const maxWidth = canvas.width * 0.8;
          let y = canvas.height - 150;
          let line = "";

          words.forEach((word) => {
            const testLine = line + word + " ";
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && line.length > 0) {
            ctx.fillText(line, canvas.width / 2, y);
            line = word + " ";
            y -= lineHeight;
            } else {
            line = testLine;
            }
          });
          ctx.fillText(line, canvas.width / 2, y);

          ctx.restore();
        }
      }

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    startTimeRef.current = Date.now();
    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [config, isPlaying]);

  return (
    <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-border">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ imageRendering: "smooth" }}
      />
    </div>
  );
}

