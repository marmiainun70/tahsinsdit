import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CBTTimerProps {
  initialSeconds: number;
  onTimeUp: () => void;
  onTick?: (remaining: number) => void;
}

export function CBTTimer({ initialSeconds, onTimeUp, onTick }: CBTTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (onTick) onTick(next);
        if (next <= 0) {
          clearInterval(timerId);
          onTimeUp();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, onTimeUp, onTick]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isWarning = timeLeft < 300; // 5 minutes warning
  const isDanger = timeLeft < 60; // 1 minute danger

  return (
    <div className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-semibold shadow-sm transition-colors",
      isDanger ? "bg-red-100 text-red-700 animate-pulse border border-red-200" :
      isWarning ? "bg-amber-100 text-amber-700 border border-amber-200" :
      "bg-emerald-50 text-emerald-700 border border-emerald-100"
    )}>
      <Clock className="w-5 h-5" />
      {formatTime(timeLeft)}
    </div>
  );
}
