import { useState, useEffect } from 'react';
import { ShieldCheck, Heart, Building2 } from 'lucide-react';

interface TenantLogoProps {
  src?: string;
  name: string;
  className?: string;
}

export function TenantLogo({ src, name, className = "w-12 h-12" }: TenantLogoProps) {
  const [error, setError] = useState(!src);

  useEffect(() => {
    setError(!src);
  }, [src]);

  if (error || !src) {
    const nameLower = name.toLowerCase();
    
    if (nameLower.includes('safeguard')) {
      return (
        <div className={`${className} flex items-center justify-center rounded-xl bg-teal-50 border border-teal-200/50 text-teal-600 shadow-sm flex-shrink-0`}>
          <ShieldCheck className="w-5 h-5" strokeWidth={2.5} />
        </div>
      );
    }
    
    if (nameLower.includes('healthfirst')) {
      return (
        <div className={`${className} flex items-center justify-center rounded-xl bg-blue-50 border border-blue-200/50 text-blue-600 shadow-sm flex-shrink-0`}>
          <Heart className="w-5 h-5 fill-blue-600/10" strokeWidth={2.5} />
        </div>
      );
    }
    
    if (nameLower.includes('govhealth')) {
      return (
        <div className={`${className} flex items-center justify-center rounded-xl bg-red-50 border border-red-200/50 text-red-600 shadow-sm flex-shrink-0`}>
          <Building2 className="w-5 h-5" strokeWidth={2.5} />
        </div>
      );
    }

    const firstLetter = name ? name.charAt(0).toUpperCase() : 'T';
    return (
      <div
        className={`${className} flex items-center justify-center font-extrabold text-white text-xs rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-md border border-rose-400/20 flex-shrink-0`}
      >
        {firstLetter}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`${className} object-cover rounded-xl border border-slate-200/60 bg-white flex-shrink-0`}
      onError={() => setError(true)}
    />
  );
}
