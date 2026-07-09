const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://daily-utility-hub-orpin.vercel.app';
const toolCategoriesPath = path.join(__dirname, 'src', 'data', 'toolCategories.js');
const sitemapOutputPath = path.join(__dirname, 'public', 'sitemap.xml');

function generateSitemap() {
  console.log('Generating sitemap.xml...');

  try {
    const fileContent = fs.readFileSync(toolCategoriesPath, 'utf8');
    const routeRegex = /to:\s*['"]([^'"]+)['"]/g;
    const routes = new Set();

    // Add static/core routes
    routes.add('/');
    routes.add('/dashboard');
    routes.add('/profile');
    routes.add('/login');
    routes.add('/register');

    let match;
    while ((match = routeRegex.exec(fileContent)) !== null) {
      routes.add(match[1]);
    }

    const today = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    routes.forEach(route => {
      const url = `${BASE_URL}${route}`;
      const priority = route === '/' || route === '/dashboard' ? '1.0' : '0.8';
      const changefreq = route === '/' || route === '/dashboard' ? 'daily' : 'weekly';

      xml += `
  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    });

    xml += '\n</urlset>';

    fs.writeFileSync(sitemapOutputPath, xml, 'utf8');
    console.log(`Successfully generated sitemap.xml with ${routes.size} routes!`);
  } catch (err) {
    console.error('Failed to generate sitemap:', err);
    process.exit(1);
  }
}

generateSitemap();
