import React, { useState, useRef, useEffect } from "react";

const PRESET_COLORS = [
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#EAB308", // Yellow
  "#84CC16", // Lime
  "#22C55E", // Green
  "#10B981", // Emerald
  "#14B8A6", // Teal
  "#06B6D4", // Cyan
  "#0EA5E9", // Light Blue
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#A855F7", // Purple
  "#D946EF", // Fuchsia
  "#EC4899", // Pink
  "#F43F5E", // Rose
  "#6B7280", // Gray
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div
        className="w-full flex items-center cursor-pointer p-2 border border-gray-300 rounded-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div
          className="w-6 h-6 rounded-full mr-2"
          style={{ backgroundColor: value || "#CBD5E1" }}
        />
        <span className="text-sm text-gray-700 flex-1">
          {value || "Selecione uma cor"}
        </span>
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute z-10 w-64 p-2 mt-1 bg-white border border-gray-200 rounded-md shadow-lg"
        >
          <div className="grid grid-cols-6 gap-2">
            {PRESET_COLORS.map((color) => (
              <div
                key={color}
                className={`w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition-transform ${
                  color === value ? "ring-2 ring-offset-2 ring-indigo-500" : ""
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorSelect(color)}
              />
            ))}
          </div>

          <div className="mt-2 pt-2 border-t border-gray-200">
            <label className="block text-xs text-gray-500 mb-1">
              Código de cor personalizado
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#RRGGBB"
              className="w-full p-1 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
