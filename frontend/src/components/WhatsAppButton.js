import React from 'react';

const WhatsAppButton = () => {
  const handleClick = () => {
    window.open('https://wa.me/917875757511?text=Hi%20Altanon%20Learn!%20I%27m%20interested%20in%20learning%20about%20Agentic%20AI.', '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] hover:bg-[#1ebe5d] rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
      style={{
        boxShadow: '6px 6px 16px rgba(37, 211, 102, 0.35), -3px -3px 8px rgba(255,255,255,0.3), 0 4px 12px rgba(0,0,0,0.15)',
      }}
      data-testid="whatsapp-chat-btn"
      aria-label="Chat on WhatsApp"
    >
      <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.054 31.29l6.12-1.958A15.9 15.9 0 0016.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0zm9.31 22.606c-.39 1.1-1.932 2.014-3.164 2.28-.844.18-1.946.322-5.656-1.216-4.748-1.966-7.804-6.79-8.038-7.104-.226-.314-1.886-2.512-1.886-4.792s1.194-3.4 1.618-3.866c.39-.428.852-.536 1.136-.536.282 0 .566.002.812.016.262.012.614-.1.96.732.354.852 1.206 2.938 1.312 3.152.108.214.18.464.036.748-.14.288-.212.466-.424.718-.214.252-.448.564-.64.756-.212.214-.434.446-.186.874.246.428 1.098 1.81 2.356 2.934 1.618 1.446 2.982 1.894 3.41 2.106.426.214.676.178.924-.108.248-.284 1.064-1.238 1.348-1.664.282-.426.566-.354.954-.214.39.142 2.472 1.166 2.896 1.378.426.214.71.32.812.498.108.178.108 1.028-.282 2.128z" />
      </svg>
    </button>
  );
};

export default WhatsAppButton;
