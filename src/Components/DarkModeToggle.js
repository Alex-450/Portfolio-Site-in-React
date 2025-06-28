// DarkModeToggle.jsx
import { useEffect, useState } from "react";

const DarkModeToggle = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
      <button className='footer-link' onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? "Light mode →" : "Dark mode →"}
      </button>
  );
};

export default DarkModeToggle;
