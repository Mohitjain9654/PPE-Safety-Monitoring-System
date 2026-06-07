import { useState } from "react";

export default function Sidebar() {
  const [active, setActive] = useState("Dashboard");

  const menu = [
    { name: "Dashboard", icon: "📊" },
    { name: "Analytics", icon: "📈" },
    { name: "Reports", icon: "📄" },
    { name: "Settings", icon: "⚙️" },
  ];

  return (
    <div className="w-64 h-screen bg-[#0b1220] border-r border-gray-800 flex flex-col">

      {/* LOGO */}
      <div className="p-5 border-b border-gray-800">
        <h1 className="text-xl font-bold text-green-400 tracking-wide">
          SafetyOps AI
        </h1>
        <p className="text-xs text-gray-400">PPE Monitoring</p>
      </div>

      {/* MENU */}
      <div className="flex-1 p-4 space-y-2">
        {menu.map((item) => (
          <div
            key={item.name}
            onClick={() => setActive(item.name)}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-all duration-200
              ${
                active === item.name
                  ? "bg-green-600 text-white shadow-md"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
          >
            <span>{item.icon}</span>
            <span className="text-sm font-medium">{item.name}</span>
          </div>
        ))}
      </div>

      {/* STATUS */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-green-400">Backend connected</span>
        </div>
      </div>
    </div>
  );
}