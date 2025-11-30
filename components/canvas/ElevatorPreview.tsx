"use client";

import { useState, useEffect } from "react";

export default function ElevatorPreview({
  elevatorImage,
  backgroundImage,
  direction = "up",
  speed = 0.5,
}: {
  elevatorImage: string;
  backgroundImage?: string;
  direction?: "up" | "down";
  speed?: number;
}) {
  const [backgroundOffset, setBackgroundOffset] = useState(0);

  useEffect(() => {
    if (!backgroundImage) return;

    const animationDuration = 5 / speed; // Adjust duration based on speed
    const interval = setInterval(() => {
      setBackgroundOffset((prev) => {
        const increment = direction === "up" ? -2 : 2;
        const newOffset = prev + increment;
        // Reset when it goes too far (for seamless loop effect)
        return newOffset <= -100 ? 0 : newOffset >= 100 ? 0 : newOffset;
      });
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [backgroundImage, direction, speed]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      {/* Background layer with animated translateY */}
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            transform: `translateY(${backgroundOffset}px)`,
            transition: "transform 0.1s linear",
          }}
        />
      )}
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
    </div>
  );
}

