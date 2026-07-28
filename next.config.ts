import type { NextConfig } from 'next';
import createMDX from '@next/mdx';

const nextConfig: NextConfig = {
  output: 'export', // Outputs a Single-Page Application (SPA)
  trailingSlash: true,
  pageExtensions: ['ts', 'tsx', 'md', 'mdx'],
  experimental: {
    useTypeScriptCli: true, // TODO: revisit once Typescript 7 is properly supported
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
