import React from 'react';
import { BookOpen, Brain, MessageSquare, Cloud, Bot, Zap, Code, Globe, Server, Cpu } from 'lucide-react';

const GRADIENTS = [
  'linear-gradient(135deg, #dbeafe 0%, #93c5fd 50%, #60a5fa 100%)',
  'linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 50%, #818cf8 100%)',
  'linear-gradient(135deg, #d1fae5 0%, #6ee7b7 50%, #34d399 100%)',
  'linear-gradient(135deg, #fef3c7 0%, #fcd34d 50%, #f59e0b 100%)',
  'linear-gradient(135deg, #fce7f3 0%, #f9a8d4 50%, #ec4899 100%)',
  'linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 50%, #38bdf8 100%)',
  'linear-gradient(135deg, #ede9fe 0%, #c4b5fd 50%, #a78bfa 100%)',
  'linear-gradient(135deg, #dcfce7 0%, #86efac 50%, #4ade80 100%)',
  'linear-gradient(135deg, #fff7ed 0%, #fdba74 50%, #fb923c 100%)',
  'linear-gradient(135deg, #f0f9ff 0%, #bae6fd 50%, #7dd3fc 100%)',
];

const ICONS = [Brain, Bot, MessageSquare, Cloud, Code, Zap, Globe, Server, Cpu, BookOpen];

const hashString = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const ClayCourseThumbnail = ({ title = '', category = '', className = '' }) => {
  const hash = hashString(title + category);
  const gradientIdx = hash % GRADIENTS.length;
  const iconIdx = hash % ICONS.length;
  const Icon = ICONS[iconIdx];

  return (
    <div
      className={`relative overflow-hidden flex items-center justify-center ${className}`}
      style={{
        background: GRADIENTS[gradientIdx],
        borderRadius: '1.25rem',
      }}
      data-testid="clay-course-thumbnail"
    >
      {/* Inner clay circle */}
      <div
        style={{
          width: '60%',
          height: '60%',
          maxWidth: '120px',
          maxHeight: '120px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.45)',
          backdropFilter: 'blur(8px)',
          boxShadow: `
            8px 8px 16px rgba(0,0,0,0.08),
            -6px -6px 12px rgba(255,255,255,0.8),
            inset 2px 2px 6px rgba(255,255,255,0.7),
            inset -1px -1px 3px rgba(0,0,0,0.05)
          `,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon style={{ width: '40%', height: '40%', color: 'rgba(30,41,59,0.7)' }} />
      </div>
      {/* Decorative circles */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: '20%',
          height: '20%',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.25)',
          boxShadow: '4px 4px 8px rgba(0,0,0,0.05), -2px -2px 6px rgba(255,255,255,0.6)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '8%',
          width: '14%',
          height: '14%',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)',
          boxShadow: '3px 3px 6px rgba(0,0,0,0.04), -2px -2px 4px rgba(255,255,255,0.5)',
        }}
      />
    </div>
  );
};

export default ClayCourseThumbnail;
