import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface DashboardHeroProps {
    user: any;
    rank: number;
}

export default function DashboardHero({ user, rank }: DashboardHeroProps) {
    const { t } = useTranslation();

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="group relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-3xl border border-white/10 shadow-2xl transition-all hover:scale-[1.02] hover:shadow-indigo-500/20 dark:border-white/5">
                {/* Background & Glass Effect */}
                <div className="absolute inset-0 bg-slate-900">
                    {/* Animated Gradients */}
                    <div className="absolute -top-[50%] -right-[50%] h-[500px] w-[500px] rounded-full bg-indigo-500/30 blur-[100px] transition-all duration-1000 group-hover:bg-indigo-500/40" />
                    <div className="absolute -bottom-[50%] -left-[50%] h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[100px] transition-all duration-1000 group-hover:bg-blue-500/30" />
                </div>

                {/* Glass Overlay */}
                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />

                <div className="relative z-10 flex h-full flex-col p-6 sm:p-8">

                    {/* Header: User Info & Rank */}
                    <div className="flex items-start justify-between">
                        <Link href="/profile" className="flex items-center gap-4 transition-opacity hover:opacity-80">
                            <div className="relative">
                                <div className="h-16 w-16 overflow-hidden rounded-full ring-4 ring-white/10 sm:h-20 sm:w-20">
                                    <img
                                        src={user.profile_photo_url}
                                        alt={user.name}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-lg ring-4 ring-slate-900">
                                    ✨
                                </div>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black tracking-tight text-white sm:text-3xl">{user.name}</h3>
                                <p className="text-sm font-medium text-indigo-300 sm:text-base">Level {Math.floor(user.points / 100) + 1} Challenger</p>
                            </div>
                        </Link>

                        <div className="text-right">
                            <div className="text-xs font-bold tracking-wider text-indigo-200 uppercase sm:text-sm">{t('Global Rank')}</div>
                            <div className="text-3xl font-black text-white sm:text-5xl">#{rank}</div>
                        </div>
                    </div>

                    {/* Main Stat: Points */}
                    <div className="mt-8 mb-6">
                        <div className="flex items-baseline gap-2">
                            <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-5xl font-black tracking-tighter text-transparent sm:text-7xl">
                                {user.points.toLocaleString()}
                            </span>
                            <span className="text-lg font-bold text-indigo-300 sm:text-2xl">PTS</span>
                        </div>
                        {/* Progress Bar to next level (mock calculation) */}
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-400 shadow-[0_0_15px_rgba(99,102,241,0.6)]"
                                style={{ width: `${(user.points % 100)}%` }}
                            />
                        </div>
                        <div className="mt-1 text-right text-xs font-medium text-slate-400">
                            {100 - (user.points % 100)} PTS to Level {Math.floor(user.points / 100) + 2}
                        </div>
                    </div>

                    {/* Footer Stats Grid */}
                    <div className="mt-auto grid grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-colors hover:bg-white/10">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-white">{user.wins}</div>
                                    <div className="text-xs font-bold tracking-wide text-slate-400 uppercase">{t('Victories')}</div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-colors hover:bg-white/10">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-white">
                                        {Math.round((user.wins / (user.wins + user.losses || 1)) * 100)}%
                                    </div>
                                    <div className="text-xs font-bold tracking-wide text-slate-400 uppercase">{t('Win Rate')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Background Image */}
                <div className="absolute inset-0">
                    <img
                        src="/images/rating_bg.jpg"
                        alt="Battle Arena"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-transparent"></div>
                </div>
            </div>
            <div className="group relative col-span-1 flex min-h-[260px] md:min-h-[300px] flex-col justify-center overflow-hidden rounded-3xl shadow-2xl md:col-span-2">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <img
                        src="/images/hero_bg.jpg"
                        alt="Battle Arena"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-transparent"></div>
                </div>

                <div className="relative z-10 p-6 sm:p-8">
                    <h2 className="mb-3 text-3xl font-black tracking-tighter text-white sm:text-4xl uppercase italic drop-shadow-lg">{t('Ready to compete?')}</h2>
                    <p className="mb-8 max-w-lg text-base sm:text-lg leading-relaxed font-medium text-gray-200 drop-shadow-md">
                        {t('Challenge players worldwide in real-time 1v1 battles. Climb the leaderboard and prove your knowledge.')}
                    </p>
                    <Link
                        href="/lobby"
                        className="group/btn relative w-full sm:w-auto inline-flex overflow-hidden transform items-center justify-center rounded-2xl border border-indigo-400/20 bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-4 font-black text-white shadow-xl shadow-indigo-500/30 transition-all hover:-translate-y-1 hover:from-indigo-500 hover:to-blue-500 hover:shadow-indigo-500/50"
                    >
                        <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]"></span>
                        <span className="mr-3 text-xl">⚔️</span>
                        <span className="uppercase tracking-wider">{t('Enter Battle Arena')}</span>
                    </Link>
                </div>
            </div>


        </div>
    );
}
