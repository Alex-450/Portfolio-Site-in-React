import type { NextConfig } from 'next';
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  output: 'export', // Outputs a Single-Page Application (SPA)
  trailingSlash: true,
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  async redirects() {
    return [
      {
        source: '/rss',
        destination: '/feed',
        permanent: true,
      },
      {
        source: '/rss.xml',
        destination: '/feed',
        permanent: true,
      },
    ];
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
