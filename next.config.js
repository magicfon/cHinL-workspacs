/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [{ source: "/stocks", destination: "/stocks/index.html" }];
  },
};

module.exports = nextConfig;
