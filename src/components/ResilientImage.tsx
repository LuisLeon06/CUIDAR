import React, { useState, useEffect } from 'react';
import { Leaf } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

function normalizeImagePath(rawSrc: string): string {
  if (!rawSrc) return '';
  if (rawSrc.startsWith('/src/assets/images/')) {
    return rawSrc.replace('/src/assets/images/', '/assets/images/');
  }
  return rawSrc;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = '',
  fallbackLabel,
}) => {
  const resolvedSrc = normalizeImagePath(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [resolvedSrc]);

  if (hasError || !resolvedSrc) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#1C1F1E] to-[#0A0A0A] text-[#A8C4AE] p-4 ${className}`}
        role="img"
        aria-label={alt}
      >
        <Leaf className="w-7 h-7 text-[#6FBF94] opacity-80 mb-1.5" />
        {fallbackLabel && (
          <span className="text-[11px] font-medium text-[#A0AAA4] text-center truncate max-w-full">
            {fallbackLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
};
