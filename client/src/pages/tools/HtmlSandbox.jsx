import { useEffect, useState } from 'react';

const HtmlSandbox = () => {
  const [srcDoc, setSrcDoc] = useState('');

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const codeParam = params.get('code');
      if (codeParam) {
        let base64 = codeParam.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        const binString = atob(base64);
        const bytes = Uint8Array.from(binString, (m) => m.codePointAt(0));
        const str = new TextDecoder().decode(bytes);
        const data = JSON.parse(str);
        
        // Reconstruct the combined HTML
        const combined = `<!DOCTYPE html>
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
        setSrcDoc(combined);
      }
    } catch (err) {
      console.error('Failed to parse sandbox code:', err);
    }
  }, []);

  return (
    <iframe
      srcDoc={srcDoc}
      title="sandboxed-preview"
      className="w-screen h-screen border-none block"
      sandbox="allow-scripts"
      scrolling="yes"
      style={{ width: '100vw', height: '100vh', border: 'none', background: '#ffffff' }}
    />
  );
};

export default HtmlSandbox;
