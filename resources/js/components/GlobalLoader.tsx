import { router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function GlobalLoader() {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const start = () => {
            setIsLoading(true);
            setProgress(10);
        };

        const finish = () => {
            setProgress(100);
            setTimeout(() => {
                setIsLoading(false);
                setProgress(0);
            }, 500);
        };

        const progressListener = (event: any) => {
            if (event.detail.progress.percentage) {
                setProgress(event.detail.progress.percentage);
            }
        };

        router.on('start', start);
        router.on('finish', finish);
        router.on('progress', progressListener);

        return () => {
            // Cleanup listeners if method supported, otherwise manual cleanup usually not needed in global app context
        };
    }, []);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px]"
                >
                    <div className="relative flex flex-col items-center">
                        <div className="h-16 w-16 rounded-full border-4 border-slate-700/50 border-t-blue-500 animate-spin"></div>
                        <div className="absolute overflow-hidden inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">Q</span>
                            {/* <img className="h-12 w-12 object-fit" src="/logo.png" alt="Quizz" /> */}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
