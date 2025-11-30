"use client";

import React, { useRef, useState } from "react";

type Props = {
  onSelect: (base64: string) => void;
  onClear?: () => void;
  currentImage?: string | null;
};

export default function RoomImageUploader({ onSelect, onClear, currentImage }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/i)) {
      alert("Please select a PNG or JPG image file.");
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreview(base64);
      onSelect(base64);
    };
    reader.onerror = () => {
      alert("Failed to read image file.");
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setPreview(null);
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-accent-cyan text-background rounded-lg hover:bg-accent-cyan/90 transition-colors text-sm font-medium"
        >
          Upload Existing Image
        </button>
        {preview && (
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
          >
            Clear
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleFileSelect}
        className="hidden"
      />
      {preview && (
        <div className="mt-2">
          <img
            src={preview}
            alt="Uploaded room preview"
            className="w-full rounded-lg border border-border max-h-48 object-cover"
          />
          <p className="text-xs text-gray-400 mt-1">Uploaded image ready for rendering</p>
        </div>
      )}
    </div>
  );
}

