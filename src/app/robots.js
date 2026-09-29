export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/login', '/register', '/search', '/upload', '/user-management'],
    },
    sitemap: 'https://parul-student-hub.vercel.app/sitemap.xml',
  };
}
