'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

const DarkModeToggle = ({ className }: { className?: string }) => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const darkMode = resolvedTheme === 'dark';

  return (
    <button
      className={className}
      onClick={() => setTheme(darkMode ? 'light' : 'dark')}
    >
      {darkMode ? 'Light mode ›' : 'Dark mode ›'}
    </button>
  );
};

export default DarkModeToggle;
