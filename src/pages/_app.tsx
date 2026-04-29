import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/index.css';
import '../css/dark-mode.css';
import NavBar from '../Components/NavBar';
import Footer from '../Components/Footer';
import { ThemeProvider } from 'next-themes';
import type { AppProps } from 'next/app';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const currentPath = useRef<string>(router.asPath);
  const isPopState = useRef<boolean>(false);

  useEffect(() => {
    router.beforePopState(() => {
      isPopState.current = true;
      return true;
    });

    const handleRouteChangeStart = () => {
      scrollPositions.current.set(currentPath.current, window.scrollY);
    };

    const handleRouteChangeComplete = (url: string) => {
      currentPath.current = url;
      if (isPopState.current) {
        const y = scrollPositions.current.get(url) ?? 0;
        requestAnimationFrame(() => {
          window.scrollTo({ top: y, behavior: 'instant' });
        });
        isPopState.current = false;
        return;
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);
    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="d-flex flex-column min-vh-100 blog-container">
        <NavBar />
        <main id="main-content">
          <Component {...pageProps} />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default MyApp;
