import React from "react";
import { useTheme } from "../context/ThemeContext";

function Credits() {
  const { isModern } = useTheme();

  return (
    <div className={`fixed bottom-4 right-4 rounded-lg p-4 shadow-lg text-sm max-w-xs transition-all duration-300 ${
      isModern 
        ? 'bg-white/10 backdrop-blur-lg border border-white/20 text-white' 
        : 'bg-white/90 backdrop-blur-sm border border-gray-200 text-gray-600'
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full animate-pulse ${
          isModern ? 'bg-blue-400' : 'bg-blue-500'
        }`}></div>
        <div>
          <p className={`font-medium ${isModern ? 'text-white' : 'text-gray-800'}`}>
            Developed by
          </p>
          <p className={`font-bold text-lg ${
            isModern 
              ? 'bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent' 
              : 'text-blue-600'
          }`}>
            Valdrin Preteni
          </p>
          <p className={`text-xs ${isModern ? 'text-white/70' : 'text-gray-500'}`}>
            Quiz Application System
          </p>
          {isModern && (
            <div className="flex items-center mt-1 space-x-1">
              <span className="text-xs text-white/50">✨</span>
              <span className="text-xs text-white/70">Enhanced with Modern UI</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Credits;

