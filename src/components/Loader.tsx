import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";

interface LoaderProps {
  progress: number;
  error: string | null;
  onRetry?: () => void;
}

export function Loader({ progress, error, onRetry }: LoaderProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (progress >= 100 && !error) {
      const timer = setTimeout(() => setShow(false), 800);
      return () => clearTimeout(timer);
    }
  }, [progress, error]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 w-full h-full z-[100] flex flex-col items-center justify-center bg-[#0a0a0a] text-white"
        >
          <div className="flex flex-col items-center max-w-md w-full px-6 text-center">
            {error ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="space-y-6"
              >
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto border border-red-500/20">
                  <span className="text-red-500 text-3xl font-bold">!</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Greška pri učitavanju</h2>
                <p className="text-neutral-400 text-sm">{error}</p>
                {onRetry && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onRetry}
                    className="px-6 py-2.5 rounded-full bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors shadow-lg cursor-pointer"
                  >
                    Pokušaj ponovo
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <div className="space-y-6 w-full">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                  className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto border border-white/10"
                >
                  <Building2 className="w-8 h-8 text-white" />
                </motion.div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-wider uppercase text-white">Rezidencija Vista</h2>
                  <p className="text-neutral-500 text-xs font-semibold uppercase tracking-[0.25em]">Učitavanje 3D modela</p>
                </div>
                
                {/* Progress bar container */}
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative shadow-inner">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
                
                <span className="text-neutral-400 text-xs font-semibold tracking-wider">
                  {Math.round(progress)}% Učitano
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
