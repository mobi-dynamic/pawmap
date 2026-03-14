import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        paw: {
          ink: '#122033',
          mist: '#eef4fb',
          sand: '#fff8ef',
          ok: '#2e8b57',
          warn: '#c57600',
          stop: '#c54141',
          mute: '#667085',
        },
      },
      boxShadow: {
        panel: '0 10px 30px rgba(18, 32, 51, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
