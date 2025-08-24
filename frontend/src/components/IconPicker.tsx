import React, { useState, useRef, useEffect } from "react";

// Lista de ícones comuns para finanças
const COMMON_ICONS = [
  { name: "home", icon: "🏠" },
  { name: "food", icon: "🍽️" },
  { name: "grocery", icon: "🛒" },
  { name: "transport", icon: "🚗" },
  { name: "health", icon: "💊" },
  { name: "education", icon: "📚" },
  { name: "entertainment", icon: "🎬" },
  { name: "shopping", icon: "👜" },
  { name: "utilities", icon: "💡" },
  { name: "travel", icon: "✈️" },
  { name: "sports", icon: "⚽" },
  { name: "pets", icon: "🐾" },
  { name: "gifts", icon: "🎁" },
  { name: "salary", icon: "💰" },
  { name: "investment", icon: "📈" },
  { name: "savings", icon: "💲" },
  { name: "other", icon: "📋" },
  { name: "bills", icon: "📄" },
  { name: "tax", icon: "💼" },
  { name: "car", icon: "🚙" },
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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

  const handleIconSelect = (iconName: string, iconEmoji: string) => {
    onChange(iconName);
    setIsOpen(false);
  };

  const filteredIcons = searchTerm
    ? COMMON_ICONS.filter((icon) =>
        icon.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : COMMON_ICONS;

  // Encontrar o emoji atual com base no nome
  const currentIcon =
    COMMON_ICONS.find((icon) => icon.name === value)?.icon || "📋";

  return (
    <div className="relative">
      <div
        className="w-full flex items-center cursor-pointer p-2 border border-gray-300 rounded-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-6 h-6 flex items-center justify-center mr-2">
          <span className="text-xl">{currentIcon}</span>
        </div>
        <span className="text-sm text-gray-700 flex-1">
          {value ? value : "Selecione um ícone"}
        </span>
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute z-10 w-64 p-2 mt-1 bg-white border border-gray-200 rounded-md shadow-lg"
        >
          <input
            type="text"
            placeholder="Buscar ícone..."
            className="w-full mb-2 p-2 border border-gray-300 rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="max-h-60 overflow-y-auto">
            <div className="grid grid-cols-4 gap-2">
              {filteredIcons.map((icon) => (
                <div
                  key={icon.name}
                  className={`p-2 flex flex-col items-center justify-center rounded cursor-pointer hover:bg-gray-100 ${
                    icon.name === value
                      ? "bg-indigo-100 border border-indigo-300"
                      : ""
                  }`}
                  onClick={() => handleIconSelect(icon.name, icon.icon)}
                >
                  <span className="text-2xl mb-1">{icon.icon}</span>
                  <span className="text-xs text-gray-600 truncate w-full text-center">
                    {icon.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {filteredIcons.length === 0 && (
            <div className="text-center py-2 text-gray-500">
              Nenhum ícone encontrado
            </div>
          )}

          <div className="mt-2 pt-2 border-t border-gray-200">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Nome do ícone"
              className="w-full p-1 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default IconPicker;
