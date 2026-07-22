import React from "react";

interface StudentAvatarProps {
  gender: "L" | "P" | string;
  className?: string;
}

export const StudentAvatar: React.FC<StudentAvatarProps> = ({ gender, className = "" }) => {
  const isMale = gender === "L" || gender.toLowerCase() === "laki-laki";

  if (isMale) {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full rounded-full bg-[#E8F3EA] overflow-hidden ${className}`}
      >
        {/* Shoulders / Shirt */}
        <path d="M20 100 C 20 70, 80 70, 80 100 Z" fill="#ECA266" /> {/* Inner shirt neck */}
        <path d="M10 100 C 10 75, 90 75, 90 100 Z" fill="#059669" /> {/* Green Shirt */}
        
        {/* Neck */}
        <rect x="42" y="60" width="16" height="15" fill="#F3C396" />
        <path d="M42 75 Q 50 82 58 75" fill="#ECA266" /> {/* Neck shadow */}
        
        {/* Ears */}
        <circle cx="28" cy="52" r="6" fill="#F3C396" />
        <circle cx="72" cy="52" r="6" fill="#F3C396" />
        
        {/* Face */}
        <path d="M30 45 C 30 75, 70 75, 70 45 C 70 25, 30 25, 30 45 Z" fill="#FDE0BA" />
        
        {/* Hair side */}
        <path d="M30 45 Q 30 35 35 30 L 28 40 Z" fill="#2E3333" />
        <path d="M70 45 Q 70 35 65 30 L 72 40 Z" fill="#2E3333" />

        {/* Peci */}
        <path d="M28 35 C 28 10, 72 10, 72 35 Q 50 40 28 35 Z" fill="#1C2623" />
        <path d="M28 35 Q 50 42 72 35 L 72 37 Q 50 44 28 37 Z" fill="#0F1714" /> {/* Peci rim */}
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full rounded-full bg-[#FDF0F3] overflow-hidden ${className}`}
    >
      {/* Hijab Shoulders */}
      <path d="M10 100 C 10 70, 90 70, 90 100 Z" fill="#ECA266" />
      <path d="M5 100 C 5 60, 95 60, 95 100 Z" fill="#F48FB1" /> {/* Pink Hijab Drape */}
      <path d="M25 100 C 25 70, 75 70, 75 100 Z" fill="#F06292" /> {/* Inner shadow drape */}

      {/* Face Base */}
      <path d="M32 45 C 32 70, 68 70, 68 45 C 68 25, 32 25, 32 45 Z" fill="#FDE0BA" />
      
      {/* Hijab Head covering */}
      <path d="M25 50 C 20 15, 80 15, 75 50 C 73 75, 50 85, 25 50 Z" fill="#F48FB1" />
      <path d="M25 50 C 20 15, 80 15, 75 50 C 73 75, 50 85, 25 50 Z" fill="none" stroke="#F06292" strokeWidth="2" />

      {/* Face Window (Inner Hijab line) */}
      <path d="M35 40 C 35 25, 65 25, 65 40 C 65 60, 50 65, 35 40 Z" fill="#FDE0BA" />
      
      {/* Inner ciput (under-cap) */}
      <path d="M38 35 Q 50 28 62 35 Q 50 25 38 35 Z" fill="#FCE4EC" />
    </svg>
  );
};
