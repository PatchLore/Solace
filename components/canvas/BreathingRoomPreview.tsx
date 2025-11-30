"use client";

export default function BreathingRoomPreview({
  roomImage,
  width,
  height,
  liftSpeed = 0.03,
}: {
  roomImage: string;
  width: number;
  height: number;
  liftSpeed?: number;
}) {
  // Calculate animation duration based on lift speed (faster = shorter duration)
  const animationDuration = 5 / (liftSpeed * 100);
  
  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <div
        className="w-full h-full bg-cover bg-center"
        style={{
          backgroundImage: `url(${roomImage})`,
          backgroundSize: "cover",
          animation: `lift ${animationDuration}s linear infinite`,
        }}
      />
      <style jsx>{`
        @keyframes lift {
          from {
            transform: translateY(0px);
          }
          to {
            transform: translateY(-30px);
          }
        }
      `}</style>
    </div>
  );
}
