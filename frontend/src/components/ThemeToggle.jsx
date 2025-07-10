import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { toggleTheme, isModern } = useTheme();

  return (
    <div className="flex items-center space-x-3">
      <span className={`text-sm font-medium ${isModern ? 'text-gray-300' : 'text-gray-600'}`}>
        Classic
      </span>
      <button
        onClick={toggleTheme}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          isModern 
            ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
            : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isModern ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
      <span className={`text-sm font-medium ${isModern ? 'text-blue-400' : 'text-gray-600'}`}>
        Modern
      </span>
    </div>
  );
};

export default ThemeToggle;

