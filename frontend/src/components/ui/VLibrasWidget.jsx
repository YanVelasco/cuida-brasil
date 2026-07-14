import React, { useEffect } from 'react';

export default function VLibrasWidget() {
  useEffect(() => {
    // Evita duplicar o script se já foi carregado
    if (document.getElementById('vlibras-script')) return;

    const script = document.createElement('script');
    script.id = 'vlibras-script';
    script.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
    script.async = true;
    
    script.onload = () => {
      if (window.VLibras) {
        new window.VLibras.Widget('https://vlibras.gov.br/app');
      }
    };
    
    document.body.appendChild(script);
  }, []);

  return (
    <div vw="true" className="enabled">
      <div vw-access-button="true" className="active"></div>
      <div vw-plugin-wrapper="true">
        <div className="vw-plugin-top-wrapper"></div>
      </div>
    </div>
  );
}
