import '../css/index.css';
import '../css/dark-mode.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import NavBar from '../Components/NavBar';
import Footer from '../Components/Footer';
import { ThemeProvider } from 'next-themes';
import type { AppProps } from 'next/app';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      <div className="d-flex flex-column min-vh-100 blog-container">
        <NavBar />
        <Component {...pageProps} />
        <Footer />
      </div>
    </ThemeProvider>
  );
}

export default MyApp;
