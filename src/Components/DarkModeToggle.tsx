'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const DarkModeToggle = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Make sure component is mounted before accessing `theme` to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Avoid rendering until mounted
    return null;
  }

  const darkMode = resolvedTheme === 'dark';

  return (
    <button
      className="footer-link"
      onClick={() => setTheme(darkMode ? 'light' : 'dark')}
    >
      {darkMode ? 'Light mode →' : 'Dark mode →'}
    </button>
  );
};

export default DarkModeToggle;
