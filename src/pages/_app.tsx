import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/index.css';
import '../css/dark-mode.css';
import NavBar from '../Components/NavBar';
import Footer from '../Components/Footer';
import { ThemeProvider } from 'next-themes';
import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
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
