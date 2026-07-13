import { useEffect, useState } from 'react';
import api from '../../lib/api';

const HtmlSandbox = () => {
  const [srcDoc, setSrcDoc] = useState('');

  useEffect(() => {
    const loadCode = async () => {
      try {
        const hash = window.location.hash;
        const params = new URLSearchParams(window.location.search);
        const codeParam = params.get('code');
        const idParam = params.get('id');
        
        let data = null;

        if (hash && hash.startsWith('#code=')) {
          const base64 = hash.replace('#code=', '')
            .replace(/-/g, '+')
            .replace(/_/g, '/');
          let padded = base64;
          while (padded.length % 4) {
            padded += '=';
          }
          const binString = atob(padded);
          const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
          const str = new TextDecoder().decode(bytes);
          data = JSON.parse(str);
        } else if (idParam) {
          const res = await api.get(`/share/metadata/${idParam}`);
          if (res.data && res.data.content) {
            data = JSON.parse(res.data.content);
          }
        } else if (codeParam) {
          let base64 = codeParam.replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) {
            base64 += '=';
          }
          const binString = atob(base64);
          const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
          const str = new TextDecoder().decode(bytes);
          data = JSON.parse(str);
        }

        if (data) {
          if (data.expiresAt && Date.now() > data.expiresAt) {
            setSrcDoc(`<!DOCTYPE html><html><body style="background:#09090b;color:#ef4444;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;"><h1>This share link has expired.</h1></body></html>`);
            return;
          }
          const isFullHtmlDocument = (data.h || '').trim().toLowerCase().startsWith('<!doctype html') || (data.h || '').trim().toLowerCase().startsWith('<html');
          let combined = '';
          if (isFullHtmlDocument) {
             let fullHtml = data.h || '';
             if (data.c && data.c.trim()) {
               if (fullHtml.includes('</head>')) {
                 fullHtml = fullHtml.replace('</head>', `<style>${data.c}</style></head>`);
               } else {
                 fullHtml += `<style>${data.c}</style>`;
               }
             }
             if (data.j && data.j.trim()) {
               const jsString = `<script>try { ${data.j} } catch(e) { console.error(e); }</script>`;
               if (fullHtml.includes('</body>')) {
                 fullHtml = fullHtml.replace('</body>', `${jsString}</body>`);
               } else {
                 fullHtml += jsString;
               }
             }
             combined = fullHtml;
          } else {
             combined = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Live Preview</title>
  <style>${data.c || ''}</style>
</head>
<body>
  ${data.h || ''}
  <script>
    try {
      ${data.j || ''}
    } catch(err) {
      console.error(err);
    }
  </script>
</body>
</html>`;
          }
          setSrcDoc(combined);
        }
      } catch (err) {
        console.error('Failed to load sandbox code:', err);
      }
    };
    
    loadCode();
  }, []);

  return (
    <iframe
      srcDoc={srcDoc}
      title="sandboxed-preview"
      className="w-screen h-screen border-none block"
      sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
      scrolling="yes"
      style={{ width: '100vw', height: '100vh', border: 'none', background: '#ffffff' }}
    />
  );
};

export default HtmlSandbox;
