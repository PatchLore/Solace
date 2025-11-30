"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import BreathingRoomPreview from "@/components/canvas/BreathingRoomPreview";
import DarkAcademiaPreview from "@/components/canvas/DarkAcademiaPreview";
import ElevatorPreview from "@/components/canvas/ElevatorPreview";
import SpaceElevatorPreview from "@/components/canvas/SpaceElevatorPreview";
import AudioSelector from "@/components/AudioSelector";
import RoomImageUploader from "@/components/RoomImageUploader";
import type { BreathingRoomConfig, DarkAcademiaConfig, RoomTemplate, RoomType } from "../types";
import { DEFAULT_ROOM } from "../types";
import { roomConfigs } from "@/config/rooms";
import { AUDIO_TRACKS } from "@/data/audioTracks";

const DARK_ACADEMIA_AUDIO_TRACKS = [
  { id: "candle-crackle", name: "Candle Crackle" },
  { id: "fireplace-soft", name: "Fireplace Soft" },
  { id: "library-rain", name: "Library Rain" },
  { id: "paper-turning", name: "Paper Turning" },
  { id: "deep-cello-drone", name: "Deep Cello Drone" },
];

const DARK_ACADEMIA_ROOM_STYLES = [
  { id: "dark_academia_study", name: "Dark Academia Study" },
  { id: "dark_academia_library", name: "Dark Academia Library" },
  { id: "dark_academia_corridor", name: "Dark Academia Corridor" },
  { id: "dark_academia_writer_room", name: "Dark Academia Writer Room" },
];

function EditorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Extract active room from query params, fallback to default
  const activeRoomParam = searchParams.get("room") || "";
  const roomType = searchParams.get("type"); // "elevator" or null
  
  // Get current room config (only if not elevator)
  const activeRoom = (roomType !== "elevator" ? (activeRoomParam as RoomType) : null) || DEFAULT_ROOM;
  const currentConfig = roomType !== "elevator" ? roomConfigs[activeRoom] : null;
  
  const templateParam = searchParams.get("template") as "breathing-room" | "dark-academia-room" | "space-elevator" | null;

  const [selectedTemplate, setSelectedTemplate] = useState<"breathing-room" | "dark-academia-room" | "space-elevator">(
    (templateParam as "breathing-room" | "dark-academia-room" | "space-elevator") || "breathing-room"
  );

  const [breathingConfig, setBreathingConfig] = useState<BreathingRoomConfig>({
    roomImage: currentConfig?.roomImage || "",
    breathDuration: 4,
    breathIntensity: 0.02,
    lightWarmthShift: 0.5,
    brightnessPulse: 0.3,
    durationHours: 1,
    resolution: "1080p",
    audioTrack: "brown-noise",
    customAudioFile: null,
  });

  const [darkAcademiaConfig, setDarkAcademiaConfig] = useState<DarkAcademiaConfig>({
    roomImage: "/assets/rooms/dark-academia/library.png",
    flickerIntensity: 0.7,
    warmthShift: 0.8,
    vignetteStrength: 0.6,
    dustParticles: true,
    ambientMotion: 0.2,
    durationHours: 1,
    resolution: "1080p",
    audioTrack: "candle-crackle",
    customAudioFile: null,
    showQuotes: false,
    quoteIntervalSeconds: 30,
    quoteList: [],
  });

  // Use the appropriate config based on selected template
  const config = selectedTemplate === "dark-academia-room" ? darkAcademiaConfig : breathingConfig;
  const setConfig = selectedTemplate === "dark-academia-room" ? setDarkAcademiaConfig : setBreathingConfig;

  const [isRendering, setIsRendering] = useState(false);
  const [renderStatus, setRenderStatus] = useState<string>("");
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string | null>(null);

  // Room generation state
  const [roomStyle, setRoomStyle] = useState<string>(activeRoom);
  const [darkAcademiaRoomStyle, setDarkAcademiaRoomStyle] = useState<string>("dark_academia_library");
  const [customTemplates, setCustomTemplates] = useState<RoomTemplate[]>([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [customNegativePrompt, setCustomNegativePrompt] = useState("");
  const [customTemplateName, setCustomTemplateName] = useState("");
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [aiModel, setAiModel] = useState<"flux" | "seedream" | "seedream4">("flux");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationSuccess, setGenerationSuccess] = useState<string | null>(null);
  const shaderType = "infiniteLift";
  const [audioPreset, setAudioPreset] = useState<string | null>(null);
  const [customAudioFile, setCustomAudioFile] = useState<File | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  // Elevator-specific state
  const [elevatorImage, setElevatorImage] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [elevatorDirection, setElevatorDirection] = useState<"up" | "down">("up");
  const [elevatorSpeed, setElevatorSpeed] = useState(0.5);
  
  // Space Elevator motion intensity state
  const [motionIntensity, setMotionIntensity] = useState(0.4);
  
  // Space Elevator audio selection state
  const [selectedAudio, setSelectedAudio] = useState("/audio/brown-noise.mp3");
  
  // Space Elevator loop length state (5s/10s/20s)
  const [selectedDuration, setSelectedDuration] = useState(10); // default 10s

  // Load custom templates on mount
  useEffect(() => {
    const loadCustomTemplates = async () => {
      try {
        const response = await fetch("/api/templates");
        if (response.ok) {
          const data = await response.json();
          setCustomTemplates(data.templates || []);
        }
      } catch (error) {
        console.error("Failed to load custom templates:", error);
      }
    };
    loadCustomTemplates();
  }, []);

  // Load elevator image when elevator room is selected
  useEffect(() => {
    if (roomType === "elevator") {
      if (activeRoomParam === "elevator_1") {
        setElevatorImage("/elevators/Elevator1.jpg");
      } else if (activeRoomParam === "elevator_2") {
        setElevatorImage("/elevators/Elevator2.jpg");
      }
    }
  }, [roomType, activeRoomParam]);

  // Update room image when active room changes
  useEffect(() => {
    if (selectedTemplate === "breathing-room") {
      setBreathingConfig((prev) => ({
        ...prev,
        roomImage: currentConfig?.roomImage || "",
      }));
    }
  }, [activeRoom, currentConfig?.roomImage, selectedTemplate]);

  // Update room image when room style changes (breathing room) - legacy support
  useEffect(() => {
    if (selectedTemplate === "breathing-room") {
      if (roomStyle !== "custom" && !roomStyle.startsWith("custom-")) {
        // Map legacy room styles to new room types
        const roomTypeMap: Record<string, RoomType> = {
          zen: "japanese_zen",
          brutalist: "brutalist_cube",
          neon: "neon_corridor",
          scifi: "white_scifi",
        };
        const mappedRoom = roomTypeMap[roomStyle] || activeRoom;
        const mappedConfig = roomConfigs[mappedRoom];
        setBreathingConfig((prev) => ({
          ...prev,
          roomImage: mappedConfig.roomImage,
          customTemplateName: null,
          customPrompt: null,
          customNegativePrompt: null,
        }));
      } else if (roomStyle.startsWith("custom-")) {
        const templateId = roomStyle.replace("custom-", "");
        const template = customTemplates.find((t) => t.name === templateId);
        if (template && template.imageUrl) {
          setBreathingConfig((prev) => ({
            ...prev,
            roomImage: template.imageUrl!,
            customTemplateName: template.name,
            customPrompt: template.prompt,
            customNegativePrompt: template.negativePrompt || null,
            aiModel: template.model || "flux",
          }));
          if (template.model) {
            setAiModel(template.model);
          }
        }
      }
    }
  }, [roomStyle, customTemplates, selectedTemplate]);

  // Update room image when dark academia room style changes
  useEffect(() => {
    if (selectedTemplate === "dark-academia-room") {
      if (darkAcademiaRoomStyle !== "custom" && !darkAcademiaRoomStyle.startsWith("custom-")) {
        // Use placeholder path - will be replaced when generated
        setDarkAcademiaConfig((prev) => ({
          ...prev,
          roomImage: `/assets/rooms/dark-academia/${darkAcademiaRoomStyle.replace("dark_academia_", "")}.png`,
          customTemplateName: null,
          customPrompt: null,
          customNegativePrompt: null,
        }));
      } else if (darkAcademiaRoomStyle.startsWith("custom-")) {
        const templateId = darkAcademiaRoomStyle.replace("custom-", "");
        const template = customTemplates.find((t) => t.name === templateId);
        if (template && template.imageUrl) {
          setDarkAcademiaConfig((prev) => ({
            ...prev,
            roomImage: template.imageUrl!,
            customTemplateName: template.name,
            customPrompt: template.prompt,
            customNegativePrompt: template.negativePrompt || null,
            aiModel: template.model || "flux",
          }));
          if (template.model) {
            setAiModel(template.model);
          }
        }
      }
    }
  }, [darkAcademiaRoomStyle, customTemplates, selectedTemplate]);

  const handleGenerateRoom = async () => {
    setIsGenerating(true);
    setGenerationError(null);
    setGenerationSuccess(null);

    try {
      const currentRoomStyle = selectedTemplate === "dark-academia-room" ? darkAcademiaRoomStyle : roomStyle;
      const isCustom = currentRoomStyle === "custom" || currentRoomStyle.startsWith("custom-");
      let selectedTemplateData: RoomTemplate | null = null;

      if (currentRoomStyle.startsWith("custom-")) {
        // Load custom template
        const templateId = currentRoomStyle.replace("custom-", "");
        selectedTemplateData = customTemplates.find((t) => t.name === templateId) || null;
      }

      // Determine model to use
      let modelToUse: "flux" | "seedream" | "seedream4" = aiModel;
      if (selectedTemplateData && selectedTemplateData.model) {
        modelToUse = selectedTemplateData.model;
      }

      const requestBody = {
        style: isCustom ? "custom" : currentRoomStyle,
        customPrompt: isCustom
          ? selectedTemplateData
            ? selectedTemplateData.prompt
            : customPrompt
          : undefined,
        customNegativePrompt: isCustom
          ? selectedTemplateData
            ? selectedTemplateData.negativePrompt
            : customNegativePrompt || undefined
          : undefined,
        customName: customTemplateName || undefined,
        saveAsTemplate: saveAsTemplate && isCustom && !selectedTemplateData,
        model: modelToUse,
      };

      if (isCustom && !selectedTemplateData && !customPrompt.trim()) {
        throw new Error("Custom prompt is required");
      }

      const response = await fetch("/api/generate-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate room");
      }

      const data = await response.json();

      // Update config with generated image based on template
      if (selectedTemplate === "dark-academia-room") {
        setDarkAcademiaConfig({
          ...darkAcademiaConfig,
          roomImage: data.url,
          customTemplateName: data.templateName || customTemplateName || null,
          customPrompt: requestBody.customPrompt || null,
          customNegativePrompt: requestBody.customNegativePrompt || null,
          aiModel: modelToUse,
        });
      } else {
        setBreathingConfig({
          ...breathingConfig,
          roomImage: data.url,
          customTemplateName: data.templateName || customTemplateName || null,
          customPrompt: requestBody.customPrompt || null,
          customNegativePrompt: requestBody.customNegativePrompt || null,
          aiModel: modelToUse,
        });
      }

      setGenerationSuccess(
        data.templateSaved
          ? "Custom room generated and saved as template!"
          : "Custom room generated successfully!"
      );

      // Reload custom templates if one was saved
      if (data.templateSaved) {
        const templatesResponse = await fetch("/api/templates");
        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json();
          setCustomTemplates(templatesData.templates || []);
        }
      }

      // Reset form
      setCustomPrompt("");
      setCustomNegativePrompt("");
      setCustomTemplateName("");
      setSaveAsTemplate(false);
    } catch (error) {
      console.error("Generate room error:", error);
      setGenerationError(
        error instanceof Error ? error.message : "Failed to generate room"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRender = async (testMode: boolean = false) => {
    // Space Elevator render (cloud-rendered)
    if (selectedTemplate === "space-elevator") {
      try {
        setIsRendering(true);
        setRenderStatus(testMode ? "Running 10s test render…" : "Starting render…");

        const elevatorImagePath = "/elevators/Elevator1.jpg"; // Default, can be made dynamic
        
        const res = await fetch("/api/render", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            template: "space-elevator",
            elevatorImage: elevatorImagePath,
            intensity: motionIntensity,
            durationSeconds: selectedDuration,
            audio: selectedAudio,
            testMode: testMode,
          })
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Space Elevator render failed");
        }

        setRenderedVideoUrl(data.videoUrl);
        setRenderStatus("");

      } catch (error: any) {
        console.error(error);
        setRenderStatus(error.message || "Render failed");
      } finally {
        setIsRendering(false);
      }
      return;
    }
    
    // Elevator room render
    if (roomType === "elevator") {
      if (!elevatorImage || !backgroundImage) {
        alert("Please select both elevator image and background image");
        return;
      }

      setIsRendering(true);
      try {
        // Convert images to base64
        const convertToBase64 = async (imageUrl: string): Promise<string> => {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64String = reader.result as string;
              const base64Data = base64String.includes(',') 
                ? base64String.split(',')[1] 
                : base64String;
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        };

        const elevatorBase64 = await convertToBase64(elevatorImage);
        const backgroundBase64 = backgroundImage.startsWith("data:") 
          ? backgroundImage.split(",")[1] 
          : await convertToBase64(backgroundImage);

        const res = await fetch("/api/render/elevator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            elevatorImage: elevatorBase64,
            backgroundImage: backgroundBase64,
            duration: 10,
            speed: elevatorSpeed,
            direction: elevatorDirection,
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // Convert base64 video to blob URL for download/preview
        const videoBlob = new Blob(
          [Uint8Array.from(atob(data.videoBase64), c => c.charCodeAt(0))],
          { type: "video/mp4" }
        );
        const videoUrl = URL.createObjectURL(videoBlob);
        setRenderedVideoUrl(videoUrl);

      } catch (err) {
        console.error("Elevator render failed:", err);
        alert("Render failed: " + (err instanceof Error ? err.message : "Unknown error"));
      } finally {
        setIsRendering(false);
      }
      return;
    }

    // Regular infinite zoom render
    if (!uploadedImage && !currentConfig?.roomImage) return;

    setIsRendering(true);
    try {
      // Load image as base64
      const img = uploadedImage || currentConfig?.roomImage || "";
      
      // Convert image URL to base64
      const response = await fetch(img);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          // Remove data URL prefix if present
          const base64Data = base64String.includes(',') 
            ? base64String.split(',')[1] 
            : base64String;
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const res = await fetch("/api/renderInfinite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          duration: 10,
          speed: 0.8
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRenderedVideoUrl(data.videoUrl);

    } catch (err) {
      console.error("Render failed:", err);
      alert("Render failed: " + (err instanceof Error ? err.message : "Unknown error"));
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-2xl md:text-3xl font-light">Editor</h1>
          <div></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview Panel */}
          <div className="lg:col-span-2">
            <div className="bg-panel border border-border rounded-lg p-4">
              <h2 className="text-lg mb-4 font-medium">Preview</h2>
              {roomType === "elevator" ? (
                <ElevatorPreview
                  elevatorImage={elevatorImage || "/elevators/Elevator1.jpg"}
                  backgroundImage={backgroundImage || undefined}
                  direction={elevatorDirection}
                  speed={elevatorSpeed}
                />
              ) : selectedTemplate === "space-elevator" ? (
                <SpaceElevatorPreview
                  elevatorImage="/elevators/Elevator1.jpg"
                  intensity={motionIntensity}
                />
              ) : selectedTemplate === "dark-academia-room" ? (
                <DarkAcademiaPreview config={darkAcademiaConfig} isPlaying={true} />
              ) : (
                <BreathingRoomPreview
                  roomImage={uploadedImage || currentConfig?.roomImage || ""}
                  width={1920}
                  height={1080}
                  liftSpeed={currentConfig?.liftSpeed || 0.03}
                />
              )}
            </div>
          </div>

          {/* Controls Panel */}
          <div className="space-y-6">
            {/* Scene Template Selector */}
            <div className="bg-panel border border-border rounded-lg p-4">
              <h2 className="text-lg mb-4 font-medium">Scene Template</h2>
              <select
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value as "breathing-room" | "dark-academia-room" | "space-elevator")}
                className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
              >
                <option value="breathing-room">Breathing Room</option>
                <option value="dark-academia-room">Dark Academia Room</option>
                <option value="space-elevator">Space Elevator</option>
              </select>
            </div>

            {/* Room Background Controls */}
            {selectedTemplate !== "space-elevator" && (
            <div className="bg-panel border border-border rounded-lg p-4">
              <h2 className="text-lg mb-4 font-medium">Room Background</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    AI Model
                  </label>
                  <select
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value as "flux" | "seedream" | "seedream4")}
                    className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
                    disabled={roomStyle.startsWith("custom-")}
                  >
                    <option value="flux">Flux (Stable, cinematic)</option>
                    <option value="seedream">Seedream XL (Atmospheric)</option>
                    <option value="seedream4">Seedream 4 (ByteDance – cinematic)</option>
                  </select>
                  {roomStyle.startsWith("custom-") && (
                    <p className="text-xs text-gray-500 mt-1">
                      Model locked to template setting
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Room Style
                  </label>
                  {selectedTemplate === "dark-academia-room" ? (
                    <select
                      value={darkAcademiaRoomStyle}
                      onChange={(e) => setDarkAcademiaRoomStyle(e.target.value)}
                      className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
                    >
                      {DARK_ACADEMIA_ROOM_STYLES.map((style) => (
                        <option key={style.id} value={style.id}>
                          {style.name}
                        </option>
                      ))}
                      <option disabled>---</option>
                      <option value="custom">Custom Prompt</option>
                      {customTemplates.filter((t) => t.style?.includes("dark_academia")).length > 0 && (
                        <>
                          <option disabled>--- Your Custom Rooms ---</option>
                          {customTemplates
                            .filter((t) => t.style?.includes("dark_academia"))
                            .map((template) => (
                              <option key={template.name} value={`custom-${template.name}`}>
                                {template.name}
                              </option>
                            ))}
                        </>
                      )}
                    </select>
                  ) : (
                    <select
                      value={roomStyle}
                      onChange={(e) => setRoomStyle(e.target.value)}
                      className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
                    >
                      <option value="zen">Japanese Zen Room</option>
                      <option value="brutalist">Brutalist Concrete Cube</option>
                      <option value="neon">Neon Corridor</option>
                      <option value="scifi">Sci-Fi White Room</option>
                      <option disabled>---</option>
                      <option value="custom">Custom Prompt</option>
                      {customTemplates.filter((t) => !t.style?.includes("dark_academia")).length > 0 && (
                        <>
                          <option disabled>--- Your Custom Rooms ---</option>
                          {customTemplates
                            .filter((t) => !t.style?.includes("dark_academia"))
                            .map((template) => (
                              <option key={template.name} value={`custom-${template.name}`}>
                                {template.name}
                              </option>
                            ))}
                        </>
                      )}
                    </select>
                  )}
                </div>

                {/* Upload Existing Image */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Upload Existing Image
                  </label>
                  <RoomImageUploader
                    onSelect={(base64) => setUploadedImage(base64)}
                    onClear={() => setUploadedImage(null)}
                    currentImage={uploadedImage}
                  />
                  {uploadedImage && (
                    <p className="text-xs text-yellow-400 mt-2">
                      ⚠️ Uploaded image active — Runware generation disabled
                    </p>
                  )}
                </div>

                {/* Generate Background Button - Always Visible */}
                <button
                  onClick={handleGenerateRoom}
                  disabled={
                    isGenerating ||
                    !selectedTemplate ||
                    Boolean(uploadedImage) ||
                    ((selectedTemplate === "dark-academia-room" ? darkAcademiaRoomStyle === "custom" : roomStyle === "custom") && !customPrompt.trim())
                  }
                  className={`w-full py-3 rounded-lg font-medium transition-all ${
                    isGenerating ||
                    !selectedTemplate ||
                    Boolean(uploadedImage) ||
                    ((selectedTemplate === "dark-academia-room" ? darkAcademiaRoomStyle === "custom" : roomStyle === "custom") && !customPrompt.trim())
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-accent-violet text-white hover:bg-accent-violet/90 glow-violet"
                  }`}
                >
                  {isGenerating ? `Generating with Runware (${aiModel === "flux" ? "Flux" : aiModel === "seedream4" ? "Seedream 4" : "Seedream"})...` : "Generate Background (Runware)"}
                </button>

                {(
                  selectedTemplate === "dark-academia-room"
                    ? (darkAcademiaRoomStyle === "custom" || darkAcademiaRoomStyle.startsWith("custom-"))
                    : (roomStyle === "custom" || roomStyle.startsWith("custom-"))
                ) ? (
                  <>
                    { (selectedTemplate === "dark-academia-room" 
                        ? darkAcademiaRoomStyle === "custom"
                        : roomStyle === "custom") ? (
                      <>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">
                            Custom Prompt *
                          </label>
                          <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="Describe your room... e.g., 'minimalist library with warm lighting, bookshelves, cozy atmosphere'"
                            rows={3}
                            className="w-full bg-background border border-border rounded px-3 py-2 text-sm resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">
                            Optional Negative Prompt
                          </label>
                          <textarea
                            value={customNegativePrompt}
                            onChange={(e) => setCustomNegativePrompt(e.target.value)}
                            placeholder="What to avoid... e.g., 'people, text, cluttered, bright colors'"
                            rows={2}
                            className="w-full bg-background border border-border rounded px-3 py-2 text-sm resize-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">
                            Template Name (optional)
                          </label>
                          <input
                            type="text"
                            value={customTemplateName}
                            onChange={(e) => setCustomTemplateName(e.target.value)}
                            placeholder="My Dream Room"
                            className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="saveTemplate"
                            checked={saveAsTemplate}
                            onChange={(e) => setSaveAsTemplate(e.target.checked)}
                            className="mr-2"
                          />
                          <label htmlFor="saveTemplate" className="text-sm text-gray-400">
                            Save as reusable Room Template
                          </label>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-400 p-3 bg-background rounded border border-border">
                        Using saved template:{" "}
                        {customTemplates.find((t) =>
                          `custom-${t.name}` ===
                          (selectedTemplate === "dark-academia-room" ? darkAcademiaRoomStyle : roomStyle)
                        )?.name}
                      </div>
                    )}

                    <button
                      onClick={handleGenerateRoom}
                      disabled={isGenerating || ((selectedTemplate === "dark-academia-room" ? darkAcademiaRoomStyle === "custom" : roomStyle === "custom") && !customPrompt.trim())}
                      className={`w-full py-3 rounded-lg font-medium transition-all ${
                        isGenerating || ((selectedTemplate === "dark-academia-room" ? darkAcademiaRoomStyle === "custom" : roomStyle === "custom") && !customPrompt.trim())
                          ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                          : "bg-accent-violet text-white hover:bg-accent-violet/90 glow-violet"
                      }`}
                    >
                      {isGenerating ? `Generating with Runware (${aiModel === "flux" ? "Flux" : aiModel === "seedream4" ? "Seedream 4" : "Seedream"})...` : "Generate Background (Runware)"}
                    </button>

                    {generationError && (
                      <div className="p-3 bg-red-900/20 border border-red-500/50 rounded text-sm text-red-400">
                        {generationError}
                      </div>
                    )}

                    {generationSuccess && (
                      <div className="p-3 bg-green-900/20 border border-green-500/50 rounded text-sm text-green-400">
                        {generationSuccess}
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            </div>
            )}

            {/* Template-Specific Controls */}
            {roomType === "elevator" ? (
              <>
                {/* Elevator Controls */}
                <div className="bg-panel border border-border rounded-lg p-4">
                  <h2 className="text-lg mb-4 font-medium">Elevator Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Elevator Image
                      </label>
                      <div className="text-sm text-gray-300 mb-2">
                        {elevatorImage ? (
                          <span className="text-green-400">✓ {elevatorImage.split('/').pop()}</span>
                        ) : (
                          <span className="text-gray-500">Not selected</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Background Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setBackgroundImage(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
                      />
                      {backgroundImage && (
                        <div className="mt-2 text-xs text-green-400">✓ Background loaded</div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Direction: {elevatorDirection === "up" ? "Up ↑" : "Down ↓"}
                      </label>
                      <select
                        value={elevatorDirection}
                        onChange={(e) => setElevatorDirection(e.target.value as "up" | "down")}
                        className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
                      >
                        <option value="up">Up</option>
                        <option value="down">Down</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Speed: {elevatorSpeed.toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="2.0"
                        step="0.1"
                        value={elevatorSpeed}
                        onChange={(e) => setElevatorSpeed(parseFloat(e.target.value))}
                        className="w-full accent-accent-cyan"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : selectedTemplate === "space-elevator" ? (
              <>
                {/* Space Elevator Controls */}
                <div className="bg-panel border border-border rounded-lg p-4">
                  <h2 className="text-lg mb-4 font-medium">Space Elevator Settings</h2>
                  <p className="text-sm text-gray-400 mb-4">
                    Cloud-rendered motion video. No local FFmpeg required.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Motion Intensity: {(motionIntensity * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={motionIntensity}
                        onChange={(e) => setMotionIntensity(parseFloat(e.target.value))}
                        className="w-full accent-accent-cyan"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Controls the speed of vertical motion (0.2-0.8)
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2 font-medium">
                        Background Audio
                      </label>
                      {(() => {
                        const tracks = AUDIO_TRACKS; // ← force all to show
                        console.log("Audio tracks loaded:", tracks);
                        return (
                          <select
                            value={selectedAudio}
                            onChange={(e) => setSelectedAudio(e.target.value)}
                            className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
                          >
                            {tracks.map((track) => (
                              <option key={track.id} value={track.url}>
                                {track.name}
                              </option>
                            ))}
                          </select>
                        );
                      })()}
                    </div>
                    {/* Loop Length Selector */}
                    <div className="mt-6">
                      <label className="block font-medium mb-2 text-sm text-gray-400">Loop Length</label>
                      <div className="flex gap-3">
                        {[5, 10, 20].map((sec) => (
                          <button
                            key={sec}
                            onClick={() => setSelectedDuration(sec)}
                            className={`px-4 py-2 rounded border transition-all ${
                              selectedDuration === sec
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-background text-gray-300 border-border hover:bg-background/80"
                            }`}
                          >
                            {sec}s
                          </button>
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        This clip is designed to loop. For long streams, simply loop it in your editor or streaming platform.
                      </p>
                      {!process.env.NEXT_PUBLIC_RUNWARE_MOTION_MODEL && (
                        <div className="p-2 text-sm bg-yellow-100 border border-yellow-300 mt-4 rounded text-yellow-800">
                          ⚠️ Runware motion is not configured. 10s/20s loops will fallback to LTX (higher cost).
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 mt-4">
                      <button
                        onClick={() => handleRender(false)}
                        disabled={isRendering}
                        className="w-full py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
                      >
                        {isRendering ? "Generating..." : "Generate Video"}
                      </button>
                      <button
                        onClick={() => handleRender(true)}
                        disabled={isRendering}
                        className="w-full py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-all"
                      >
                        Test Render (10s)
                      </button>
                    </div>
                    {renderStatus && (
                      <p className="text-sm text-gray-400 mt-2">{renderStatus}</p>
                    )}
                  </div>
                </div>
              </>
            ) : selectedTemplate === "breathing-room" ? (
              <>
                {/* Infinite Zoom Motion Info */}
                <div className="bg-panel border border-border rounded-lg p-4">
                  <h2 className="text-lg mb-4 font-medium">Infinite Lift Motion</h2>
                  <p className="text-sm text-gray-400">
                    Creates a smooth upward-floating infinite zoom effect using cloud rendering.
                  </p>
                </div>
                {/* Legacy Breathing Controls - Hidden but kept for compatibility */}
                <div className="bg-panel border border-border rounded-lg p-4 hidden">
                  <h2 className="text-lg mb-4 font-medium">Breathing</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Breath Duration: {breathingConfig.breathDuration}s
                      </label>
                      <input
                        type="range"
                        min="2"
                        max="8"
                        step="0.1"
                        value={breathingConfig.breathDuration}
                        onChange={(e) =>
                          setBreathingConfig({ ...breathingConfig, breathDuration: parseFloat(e.target.value) })
                        }
                        className="w-full accent-accent-cyan"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Breath Intensity: {(breathingConfig.breathIntensity * 100).toFixed(1)}%
                      </label>
                      <input
                        type="range"
                        min="0.01"
                        max="0.03"
                        step="0.001"
                        value={breathingConfig.breathIntensity}
                        onChange={(e) =>
                          setBreathingConfig({ ...breathingConfig, breathIntensity: parseFloat(e.target.value) })
                        }
                        className="w-full accent-accent-cyan"
                      />
                    </div>
                  </div>
                </div>

                {/* Lighting Controls */}
                <div className="bg-panel border border-border rounded-lg p-4">
                  <h2 className="text-lg mb-4 font-medium">Lighting</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Warmth Shift: {(breathingConfig.lightWarmthShift * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={breathingConfig.lightWarmthShift}
                        onChange={(e) =>
                          setBreathingConfig({ ...breathingConfig, lightWarmthShift: parseFloat(e.target.value) })
                        }
                        className="w-full accent-accent-violet"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Brightness Pulse: {(breathingConfig.brightnessPulse * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={breathingConfig.brightnessPulse}
                        onChange={(e) =>
                          setBreathingConfig({ ...breathingConfig, brightnessPulse: parseFloat(e.target.value) })
                        }
                        className="w-full accent-accent-violet"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Dark Academia Controls */}
                <div className="bg-panel border border-border rounded-lg p-4">
                  <h2 className="text-lg mb-4 font-medium">Dark Academia Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Flicker Intensity: {(darkAcademiaConfig.flickerIntensity * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={darkAcademiaConfig.flickerIntensity}
                        onChange={(e) =>
                          setDarkAcademiaConfig({ ...darkAcademiaConfig, flickerIntensity: parseFloat(e.target.value) })
                        }
                        className="w-full accent-accent-violet"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Warmth Shift: {(darkAcademiaConfig.warmthShift * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={darkAcademiaConfig.warmthShift}
                        onChange={(e) =>
                          setDarkAcademiaConfig({ ...darkAcademiaConfig, warmthShift: parseFloat(e.target.value) })
                        }
                        className="w-full accent-accent-violet"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Vignette Strength: {(darkAcademiaConfig.vignetteStrength * 100).toFixed(0)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={darkAcademiaConfig.vignetteStrength}
                        onChange={(e) =>
                          setDarkAcademiaConfig({ ...darkAcademiaConfig, vignetteStrength: parseFloat(e.target.value) })
                        }
                        className="w-full accent-accent-violet"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        Ambient Motion: {(darkAcademiaConfig.ambientMotion * 100).toFixed(1)}%
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="0.5"
                        step="0.01"
                        value={darkAcademiaConfig.ambientMotion}
                        onChange={(e) =>
                          setDarkAcademiaConfig({ ...darkAcademiaConfig, ambientMotion: parseFloat(e.target.value) })
                        }
                        className="w-full accent-accent-violet"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="dustParticles"
                        checked={darkAcademiaConfig.dustParticles}
                        onChange={(e) =>
                          setDarkAcademiaConfig({ ...darkAcademiaConfig, dustParticles: e.target.checked })
                        }
                        className="mr-2"
                      />
                      <label htmlFor="dustParticles" className="text-sm text-gray-400">
                        Dust Particles
                      </label>
                    </div>
                  </div>
                </div>

                {/* Quote Mode */}
                <div className="bg-panel border border-border rounded-lg p-4">
                  <h2 className="text-lg mb-4 font-medium">Quote Mode</h2>
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="showQuotes"
                        checked={darkAcademiaConfig.showQuotes || false}
                        onChange={(e) =>
                          setDarkAcademiaConfig({ ...darkAcademiaConfig, showQuotes: e.target.checked })
                        }
                        className="mr-2"
                      />
                      <label htmlFor="showQuotes" className="text-sm text-gray-400">
                        Show Quotes Overlay
                      </label>
                    </div>
                    {darkAcademiaConfig.showQuotes && (
                      <>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">
                            Quote Interval: {darkAcademiaConfig.quoteIntervalSeconds || 30}s
                          </label>
                          <input
                            type="range"
                            min="15"
                            max="120"
                            step="5"
                            value={darkAcademiaConfig.quoteIntervalSeconds || 30}
                            onChange={(e) =>
                              setDarkAcademiaConfig({ ...darkAcademiaConfig, quoteIntervalSeconds: parseInt(e.target.value) })
                            }
                            className="w-full accent-accent-violet"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-2">
                            Quotes (one per line)
                          </label>
                          <textarea
                            value={darkAcademiaConfig.quoteList?.join("\n") || ""}
                            onChange={(e) =>
                              setDarkAcademiaConfig({
                                ...darkAcademiaConfig,
                                quoteList: e.target.value.split("\n").filter((q) => q.trim().length > 0),
                              })
                            }
                            placeholder="Enter quotes, one per line..."
                            rows={5}
                            className="w-full bg-background border border-border rounded px-3 py-2 text-sm resize-none"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Audio Controls */}
            <div className="bg-panel border border-border rounded-lg p-4">
              <AudioSelector
                presets={[
                  { id: "zensoft", label: "Zen Soft" },
                  { id: "forest", label: "Forest Air" },
                  { id: "night", label: "Night Breeze" },
                  { id: "none", label: "Silent" },
                ]}
                onChange={({ preset, customFile }) => {
                  setAudioPreset(preset);
                  setCustomAudioFile(customFile);
                }}
              />
            </div>

            {/* Render Controls */}
            {selectedTemplate !== "space-elevator" && (
            <div className="bg-panel border border-border rounded-lg p-4">
              <h2 className="text-lg mb-4 font-medium">Generate Video</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Duration
                  </label>
                  <select
                    value={config.durationHours}
                    onChange={(e) => {
                      const durationHours = parseInt(e.target.value);
                      if (selectedTemplate === "dark-academia-room") {
                        setDarkAcademiaConfig({ ...darkAcademiaConfig, durationHours });
                      } else {
                        setBreathingConfig({ ...breathingConfig, durationHours });
                      }
                    }}
                    className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
                  >
                    <option value="1">1 hour</option>
                    <option value="2">2 hours</option>
                    <option value="3">3 hours</option>
                    <option value="4">4 hours</option>
                    <option value="6">6 hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Resolution
                  </label>
                  <select
                    value={config.resolution}
                    onChange={(e) => {
                      const resolution = e.target.value as "1080p" | "4k";
                      if (selectedTemplate === "dark-academia-room") {
                        setDarkAcademiaConfig({ ...darkAcademiaConfig, resolution });
                      } else {
                        setBreathingConfig({ ...breathingConfig, resolution });
                      }
                    }}
                    className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
                  >
                    <option value="1080p">1080p @ 30fps</option>
                    <option value="4k">4K @ 30fps</option>
                  </select>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Animation</label>
                  <div className="px-3 py-2 bg-gray-800 rounded-md text-gray-200">
                    Infinite Lift Motion
                  </div>
                  <p className="text-sm text-gray-400 mt-2">
                    Creates a smooth upward-floating infinite zoom effect.
                  </p>
                </div>
                <button
                  onClick={() => handleRender(false)}
                  disabled={isRendering}
                  className={`w-full py-3 rounded-lg font-medium transition-all ${
                    isRendering
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-accent-violet text-white hover:bg-accent-violet/90 glow-violet"
                  }`}
                >
                  {isRendering ? "Generating..." : "Generate Infinite Zoom"}
                </button>
                {renderedVideoUrl && (
                  <div className="mt-4 p-4 bg-green-900/20 border border-green-500/50 rounded-lg">
                    <p className="text-sm text-green-400 mb-2">Video generated successfully!</p>
                    <video
                      src={renderedVideoUrl}
                      controls
                      loop
                      autoPlay
                      className="w-full rounded shadow mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Preview is looping to simulate long playback.
                    </p>
                    <a
                      href={renderedVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent-cyan hover:underline text-sm mt-2 inline-block"
                    >
                      View Video →
                    </a>
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PageWrapper() {
  return (
    <Suspense fallback={<div>Loading editor…</div>}>
      <EditorPage />
    </Suspense>
  );
}

