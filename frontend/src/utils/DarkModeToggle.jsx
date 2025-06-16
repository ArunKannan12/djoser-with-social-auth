// src/utils/DarkModeToggle.jsx
import React, { useEffect, useState } from "react";
import "../css/DarkMode.css"; // <-- Import the CSS

const DarkModeToggle = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) return saved === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("darkMode", darkMode.toString());
  }, [darkMode]);

  return (
    <label className="switch">
      <input
        type="checkbox"
        checked={darkMode}
        onChange={() => setDarkMode(!darkMode)}
      />
      <span className="slider">
        {darkMode ? "Dark" : "Light"}
      </span>
    </label>
  );
};

export default DarkModeToggle;
