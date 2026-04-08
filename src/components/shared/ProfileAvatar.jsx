import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const ProfileAvatar = ({ src, profile, alt, fallback, className, fallbackClassName }) => {
  // Determine source: 
  // 1. Explicit src prop (highest priority if passed directly)
  // 2. Branding avatar from nested therapist_branding (if profile provided)
  // 3. Profile avatar from profile.avatar_url (fallback)
  
  let avatarSource = src;
  
  if (!src && profile) {
    // Check nested therapist_branding (it might be an array or object depending on query)
    const branding = Array.isArray(profile.therapist_branding) 
      ? profile.therapist_branding[0] 
      : profile.therapist_branding;
      
    avatarSource = branding?.avatar_url || profile.avatar_url;
  }

  // Use Vercel avatar service as a robust default fallback if no explicit fallback text is provided
  const altText = alt || profile?.full_name || 'User';
  const defaultFallbackSrc = `https://avatar.vercel.sh/${encodeURIComponent(altText)}.png`;
  
  // Clean fallback text (e.g., take initials)
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <Avatar className={cn("h-10 w-10 border-2 border-background", className)}>
      <AvatarImage 
        src={avatarSource || defaultFallbackSrc} 
        alt={altText} 
        className="object-cover"
      />
      <AvatarFallback className={cn("bg-primary/10 text-primary font-bold", fallbackClassName)}>
        {fallback || getInitials(altText)}
      </AvatarFallback>
    </Avatar>
  );
};

export default ProfileAvatar;