import confetti from 'canvas-confetti';
import { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface GameOverDisplayProps {
    user: any;
    opponent: any;
    score: number;
    opponentScore: number;
    isWinner: boolean;
    isDraw: boolean;
    onRequestRematch?: () => void;
    rematchRequested?: boolean;
    rematchByOpponent?: boolean;
}

const GameOverDisplay = memo(({ user, opponent, score, opponentScore, isWinner, isDraw, onRequestRematch, rematchRequested, rematchByOpponent }: GameOverDisplayProps) => {
    const { t } = useTranslation();

    useEffect(() => {
        if (isWinner) {
            // Victory Sound
            const audio = new Audio('/sounds/victory.mp3');
            audio.play().catch((e) => console.log('Audio play failed', e));

            // Confetti
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'],
            });
        } else if (!isDraw) {
            // Defeat Sound
            const audio = new Audio('/sounds/defeat.mp3');
            audio.play().catch((e) => console.log('Audio play failed', e));
        }
    }, [isWinner, isDraw]);

    return (
        <div className="flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500">
            {/* Result Badge */}
            <div className="mb-8">
                {isWinner ? (
                    <div className="relative">
                        <div className="absolute inset-0 animate-ping rounded-full bg-green-500/30 duration-1000"></div>
                        <h1 className="bg-gradient-to-br from-yellow-300 to-yellow-600 bg-clip-text text-6xl font-black tracking-tighter text-transparent drop-shadow-2xl md:text-8xl">VICTORY</h1>
                        <div className="mt-2 text-lg font-bold tracking-[0.5em] text-yellow-500 uppercase">{t('Winner!')}</div>
                    </div>
                ) : isDraw ? (
                    <div>
                        <h1 className="text-6xl font-black tracking-tighter text-slate-300 md:text-8xl">DRAW</h1>
                    </div>
                ) : (
                    <div>
                        <h1 className="text-6xl font-black tracking-tighter text-red-500 md:text-8xl">DEFEAT</h1>
                        <div className="mt-2 text-lg font-bold tracking-[0.5em] text-red-400 uppercase">{t('Better luck next time')}</div>
                    </div>
                )}
            </div>

            {/* Scoreboard Card */}
            <div className="relative mb-10 w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                    {/* You */}
                    <div className="flex flex-col items-center">
                        <div className="overflow-hidden relative mb-4 h-20 w-20 rounded-full border-4 border-blue-500 shadow-xl shadow-blue-500/20 md:h-24 md:w-24">
                            {/* We don't have user object here directly but we can reuse if simplified or just show score */}
                            <img
                                src={user.profile_photo_url || user.avatar}
                                alt={user.name}
                                className="h-full w-full object-cover"
                            />

                        </div>
                        <span className="text-5xl font-black text-white">{score}</span>
                    </div>

                    {/* VS */}
                    <div className="text-2xl font-black text-slate-600 italic">VS</div>

                    {/* Opponent */}
                    <div className="flex flex-col items-center">
                        <div className="overflow-hidden relative mb-4 h-20 w-20 rounded-full border-4 border-purple-500 shadow-xl shadow-purple-500/20 md:h-24 md:w-24">
                            <img
                                src={opponent?.profile_photo_url || opponent?.avatar}
                                alt={opponent?.name}
                                className="h-full w-full object-cover"
                            />


                        </div>
                        <span className="text-5xl font-black text-white">{opponentScore}</span>
                    </div>
                </div>
            </div>

            <div className="flex w-full max-w-sm flex-col gap-3">
                {/* Rematch Section */}
                {/* Check if opponent wants rematch */}
                {rematchByOpponent && !rematchRequested && (
                    <div className="mb-2 animate-bounce text-sm font-bold text-yellow-400">
                        {t('Opponent wants a rematch!')}
                    </div>
                )}

                {onRequestRematch && (
                    <button
                        onClick={onRequestRematch}
                        disabled={rematchRequested}
                        className={`group relative flex w-full items-center justify-center overflow-hidden rounded-xl px-6 py-4 font-bold text-white shadow-xl transition-all ${rematchRequested
                                ? 'cursor-not-allowed bg-slate-600 opacity-80'
                                : 'bg-violet-600 shadow-violet-600/30 hover:scale-[1.02] hover:bg-violet-500'
                            }`}
                    >
                        {rematchRequested ? (
                            <span className="relative z-10 flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></span>
                                {t('Waiting for opponent...')}
                            </span>
                        ) : (
                            <span className="relative z-10">{t('Rematch')}</span>
                        )}
                    </button>
                )}

                <button
                    onClick={() => (window.location.href = '/lobby')}
                    className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-blue-600 px-6 py-4 font-bold text-white shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02] hover:bg-blue-500"
                >
                    <span className="relative z-10">{t('Back to Lobby')}</span>
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full"></div>
                </button>
                <button
                    onClick={() => (window.location.href = '/dashboard')}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-4 font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
                >
                    {t('Home')}
                </button>
            </div>
        </div>
    );
});

export default GameOverDisplay;
