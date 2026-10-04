const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, '.');
    return config;
  },
  async rewrites() {
    return [
      { source: "/stocks", destination: "/stocks/index.html" },
      { source: "/serenity", destination: "/serenity/index.html" },
      { source: "/alpha", destination: "/alpha/index.html" },
    ];
  },
};
