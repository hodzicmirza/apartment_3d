import { Building2 } from "lucide-react";
import { useEffect, useState } from "react";

export function VistaLoader({ 
  loading = true,
  className = "" 
}: { 
  loading?: boolean;
  className?: string;
}) {
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    if (!loading) {
      setProgress(100);
      return;
    }
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [loading]);

  return (
    <div 
      className={`fixed inset-0 w-full h-full z-[9999] flex flex-col items-center justify-center bg-gradient-to-b from-sky-300 via-sky-100 to-stone-200 transition-opacity duration-500 ${
        loading ? "opacity-100" : "opacity-0 pointer-events-none"
      } ${className}`}
    >
      <div className="flex flex-col items-center animate-pulse">
        <Building2 className="w-16 h-16 text-slate-800 mb-6 animate-bounce" />
        <h2 className="text-2xl sm:text-3xl font-black tracking-widest uppercase text-slate-800 mb-3">
          Rezidencija Vista
        </h2>
        <div className="w-48 sm:w-64 h-1.5 bg-slate-200 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-slate-800 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-4 text-xs font-semibold text-slate-500 uppercase tracking-[0.2em]">
          {progress}% UČITANO
        </p>
      </div>
    </div>
  );
}
