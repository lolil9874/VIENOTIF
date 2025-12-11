/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure API routes are accessible
  async headers() {
    return [
      {
        source: '/api/worker',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, OPTIONS',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

