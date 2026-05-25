import React from "react";
import { useTheme } from "../context/ThemeContext";

function Credits() {
  const { isModern } = useTheme();

  return (
    <div className={`fixed bottom-4 right-4 rounded-xl px-5 py-3 shadow-lg text-sm transition-all duration-300 ${
      isModern
        ? 'bg-white/10 backdrop-blur-lg border border-white/20 text-white/80'
        : 'bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-500'
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`w-2 h-2 rounded-full ${isModern ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
        <span>Developed by <strong className={isModern ? 'text-white' : 'text-gray-700'}>Valdrin Preteni</strong> &mdash; All rights reserved</span>
      </div>
    </div>
  );
}

export default Credits;

