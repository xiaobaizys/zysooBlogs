import { postStore } from '../db.js';
import { SITE_CONFIG } from '../config.js';

export async function renderRSS(container) {
    const posts = await postStore.getPublished(1, 50);
    const baseUrl = window.location.origin;
    
    const items = posts.map(p => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${baseUrl}/post/${p.slug}</link>
      <guid>${baseUrl}/post/${p.slug}</guid>
      <pubDate>${new Date(p.createdAt).toUTCString()}</pubDate>
      <description><![CDATA[${p.content.substring(0, 300)}...]]></description>
      ${p.tags.map(t => `<category>${t}</category>`).join('\n      ')}
    </item>`).join('');
    
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${SITE_CONFIG.name}</title>
  <link>${baseUrl}</link>
  <description>${SITE_CONFIG.description}</description>
  <language>zh-CN</language>
  <atom:link href="${baseUrl}/rss" rel="self" type="application/rss+xml"/>
  ${items}
</channel>
</rss>`;
    
    container.innerHTML = `<pre style="white-space:pre-wrap;font-family:var(--font-mono);">${xml.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`;
    // Also set the content-type via a Blob download
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    window.location.href = url;
}
