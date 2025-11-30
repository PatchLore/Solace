import React, { useState } from "react";

type Props = {
  presets: { id: string; label: string }[];
  onChange: (data: { preset: string | null; customFile: File | null }) => void;
};

export default function AudioSelector({ presets, onChange }: Props) {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [customAudio, setCustomAudio] = useState<File | null>(null);

  const overrideActive = Boolean(customAudio);

  const handlePresetSelect = (id: string) => {
    if (overrideActive) return; // disable presets if custom audio active
    setSelectedPreset(id);
    onChange({ preset: id, customFile: null });
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCustomAudio(file);
    setSelectedPreset(null); // disable presets
    onChange({ preset: null, customFile: file });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Audio</h3>

      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.id}
            disabled={overrideActive}
            className={`px-3 py-2 rounded border ${
              selectedPreset === p.id
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-black"
            } ${overrideActive ? "opacity-40 cursor-not-allowed" : ""}`}
            onClick={() => handlePresetSelect(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {overrideActive && (
        <div className="text-yellow-500 text-sm font-semibold">
          Custom audio selected — presets disabled
        </div>
      )}

      <div>
        <label className="block text-sm mb-1">Upload custom audio</label>
        <input type="file" accept="audio/*" onChange={handleUpload} />
      </div>
    </div>
  );
}


