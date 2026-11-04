export default function manifest() {
  return {
    name: 'EVA Sister Core',
    short_name: 'EVA',
    description: 'My AI Sister EVA',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/IMG-20261104-WA3311.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/IMG-20261104-WA3311.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
        purpose: 'any maskable',
      },
    ],
  }
}
