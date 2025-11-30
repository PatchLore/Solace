"use client";

import { useState, useEffect, useMemo } from "react";

export default function SpaceElevatorPreview({
  elevatorImage = "/elevators/Elevator1.jpg",
  intensity = 0.5,
}: {
  elevatorImage?: string;
  intensity?: number;
}) {
  const [backgroundOffset, setBackgroundOffset] = useState(0);

  // Memoize star positions so they remain stable after first render
  const stars = useMemo(() => {
    return Array.from({ length: 50 }).map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      duration: 2 + Math.random() * 3,
    }));
  }, []);

  useEffect(() => {
    // Calculate animation duration based on intensity (faster = shorter duration)
    const speed = 0.2 + intensity * 0.6; // 0.2-0.8
    const animationDuration = 5 / speed; // Adjust duration based on speed
    
    const interval = setInterval(() => {
      setBackgroundOffset((prev) => {
        const increment = -2; // Upward motion
        const newOffset = prev + increment;
        // Reset when it goes too far (for seamless loop effect)
        return newOffset <= -100 ? 0 : newOffset;
      });
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [intensity]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      {/* Background layer with animated translateY (space scene) */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-purple-900 via-indigo-900 to-black"
        style={{
          transform: `translateY(${backgroundOffset}px)`,
          transition: "transform 0.1s linear",
          backgroundSize: "cover",
        }}
      >
        {/* Simulated stars */}
        <div className="absolute inset-0 opacity-60">
          {stars.map((star, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: star.left,
                top: star.top,
                animation: `twinkle ${star.duration}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
      {/* Elevator overlay (static) */}
      <div
        className="absolute inset-0 bg-cover bg-center z-10"
        style={{
          backgroundImage: `url(${elevatorImage})`,
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

