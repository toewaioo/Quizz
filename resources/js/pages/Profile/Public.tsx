import { Head, Link, usePage } from '@inertiajs/react';
import { Zap, Trophy, XCircle, Sword, Flame, Medal, Crown, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SharedData } from '../../types';

interface MatchHistory {
    id: number;
    result: 'win' | 'loss' | 'draw';
    date: string;
    opponent: {
        name: string;
        username: string | null;
        avatar: string;
    } | null;
}

interface Achievement {
    id: number;
    name: string;
    description: string;
    icon: string;
    unlocked_at: string;
}

interface PublicProfileProps {
    profile: {
        id: number;
        name: string;
        username: string | null;
        profile_photo_url: string;
        points: number;
        wins: number;
        losses: number;
        created_at: string;
        level: number;
        rank: number;
        rank_title: string;
    };
    history: MatchHistory[];
    achievements: Achievement[];
}

export default function Public({ profile, history, achievements }: PublicProfileProps) {
    const { t } = useTranslation();
    const { auth } = usePage<SharedData>().props;

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        alert(t('Link copied to clipboard!'));
    };

    const getRankColor = (rank: string) => {
        switch (rank) {
            case 'Grandmaster': return 'from-red-500 via-orange-500 to-yellow-500';
            case 'Master': return 'from-purple-500 to-pink-500';
            case 'Diamond': return 'from-cyan-400 to-blue-600';
            case 'Gold': return 'from-yellow-300 to-yellow-600';
            case 'Silver': return 'from-slate-300 to-slate-500';
            default: return 'from-amber-700 to-amber-900'; // Bronze
        }
    };

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'Sword': return <Sword className="h-6 w-6 text-white" />;
            case 'Flame': return <Flame className="h-6 w-6 text-orange-500" />;
            case 'Medal': return <Medal className="h-6 w-6 text-yellow-500" />;
            case 'Crown': return <Crown className="h-6 w-6 text-yellow-400" />;
            case 'Sparkles': return <Sparkles className="h-6 w-6 text-purple-400" />;
            default: return <Trophy className="h-6 w-6 text-slate-400" />;
        }
    };

    return (
        <div className="relative flex min-h-screen flex-col items-center overflow-x-hidden bg-slate-950 font-sans text-white selection:bg-indigo-500 selection:text-white">
            <Head title={`${profile.name} - ${t('Profile')}`} />

            {/* Ambient Background */}
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute -left-[10%] -top-[10%] h-[600px] w-[600px] animate-pulse rounded-full bg-indigo-600/20 blur-[100px]" />
                <div className="absolute -bottom-[10%] -right-[10%] h-[600px] w-[600px] animate-pulse rounded-full bg-blue-600/20 blur-[100px] delay-1000" />
                <div className="absolute inset-0 bg-[url('/images/grid.svg')] bg-center opacity-10 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
            </div>

            {/* Content */}
            <div className="z-10 flex w-full max-w-4xl flex-col items-center p-6 md:p-12">

                {/* Navigation / Header */}
                <div className="mb-12 flex w-full items-center justify-between">
                    <Link href="/" className="text-3xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 hover:opacity-80 transition-opacity">
                        Quizz
                    </Link>
                    {auth.user ? (
                        <Link href="/" className="rounded-full border border-white/10 bg-white/5 px-6 py-2 text-sm font-bold backdrop-blur-md transition-all hover:bg-white/10 hover:scale-105">
                            {t('Dashboard')}
                        </Link>
                    ) : (
                        <Link href="/login" className="rounded-full bg-blue-600 px-8 py-2.5 text-sm font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-105 hover:bg-blue-500 hover:shadow-blue-500/40">
                            {t('Login to Battle')}
                        </Link>
                    )}
                </div>

                {/* Profile Card */}
                <div className="relative w-full overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl md:p-12">

                    {/* Level Badge - Absolute Top Right */}
                    <div className="absolute top-8 right-8 flex flex-col items-center gap-2">
                        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-inner border border-white/5">
                            <span className="text-2xl font-black text-white">{profile.level}</span>
                            <span className="absolute -bottom-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-white/10">Level</span>
                        </div>
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <div className="relative mb-6 group">
                            <div className={`absolute -inset-1 rounded-full bg-gradient-to-r ${getRankColor(profile.rank_title)} opacity-75 blur transition duration-500 group-hover:opacity-100`}></div>
                            <img
                                src={profile.profile_photo_url || `https://ui-avatars.com/api/?name=${profile.name}`}
                                alt={profile.name}
                                className="relative h-32 w-32 rounded-full border-4 border-slate-900 object-cover shadow-2xl"
                            />
                        </div>

                        <h1 className="mb-1 text-4xl font-black tracking-tight text-white md:text-5xl">{profile.name}</h1>
                        <div className="flex items-center gap-3 mb-6">
                            {profile.username && (
                                <span className="text-lg font-medium text-slate-400">@{profile.username}</span>
                            )}
                            <span className="h-1 w-1 rounded-full bg-slate-600"></span>

                            {/* Leaderboard Rank Badge */}
                            <span className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-3 py-1 border border-yellow-500/20">
                                <span className="text-yellow-500 text-sm font-bold">#{profile.rank}</span>
                            </span>

                            <span className={`text-lg font-bold bg-gradient-to-r ${getRankColor(profile.rank_title)} bg-clip-text text-transparent`}>
                                {profile.rank_title}
                            </span>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid w-full grid-cols-2 gap-4 md:gap-8">
                            <div className="group rounded-3xl bg-white/5 p-6 transition-colors hover:bg-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap className="h-4 w-4 text-slate-500 group-hover:text-yellow-400 transition-colors" />
                                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('Points')}</p>
                                </div>
                                <p className="text-3xl font-black text-white group-hover:scale-110 transition-transform">{profile.points}</p>
                            </div>
                            <div className="group rounded-3xl bg-green-500/5 p-6 transition-colors hover:bg-green-500/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <Trophy className="h-4 w-4 text-green-500/60 group-hover:text-green-400 transition-colors" />
                                    <p className="text-xs font-bold uppercase tracking-widest text-green-500/60">{t('Wins')}</p>
                                </div>
                                <p className="text-3xl font-black text-green-400 group-hover:scale-110 transition-transform">{profile.wins}</p>
                            </div>
                            <div className="group rounded-3xl bg-red-500/5 p-6 transition-colors hover:bg-red-500/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <XCircle className="h-4 w-4 text-red-500/60 group-hover:text-red-400 transition-colors" />
                                    <p className="text-xs font-bold uppercase tracking-widest text-red-500/60">{t('Losses')}</p>
                                </div>
                                <p className="text-3xl font-black text-red-400 group-hover:scale-110 transition-transform">{profile.losses}</p>
                            </div>
                        </div>

                        {/* Achievements */}
                        <div className="mt-12 w-full">
                            <h3 className="mb-6 text-left text-xl font-bold text-white flex items-center gap-2">
                                <Medal className="h-5 w-5 text-yellow-500" />
                                {t('Achievements')}
                            </h3>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                                {achievements && achievements.length > 0 ? (
                                    achievements.map((achievement) => (
                                        <div key={achievement.id} className="group relative flex flex-col items-center justify-center rounded-2xl bg-white/5 p-4 text-center transition-all hover:bg-white/10 hover:-translate-y-1">
                                            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 border border-white/10 shadow-lg group-hover:border-white/20 group-hover:shadow-indigo-500/20">
                                                {getIcon(achievement.icon)}
                                            </div>
                                            <h4 className="font-bold text-white text-sm">{achievement.name}</h4>
                                            <p className="mt-1 text-xs text-slate-400 leading-tight">{achievement.description}</p>
                                            <div className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-black/20 px-2 py-1 rounded-full">
                                                {achievement.unlocked_at}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-full rounded-2xl border border-dashed border-white/10 bg-white/5 py-8 text-center text-slate-500">
                                        {t('No achievements unlocked yet')}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Match History */}
                        <div className="mt-12 w-full">
                            <h3 className="mb-6 text-left text-xl font-bold text-white flex items-center gap-2">
                                <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {t('Recent Matches')}
                            </h3>
                            <div className="flex flex-col gap-3">
                                {history.length > 0 ? (
                                    history.map((match) => (
                                        <div key={match.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10 hover:border-white/10">
                                            <div className="flex items-center gap-4">
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl font-black text-sm uppercase ${match.result === 'win' ? 'bg-green-500/20 text-green-400' :
                                                    match.result === 'loss' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'
                                                    }`}>
                                                    {match.result === 'win' ? 'W' : match.result === 'loss' ? 'L' : 'D'}
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-bold text-white text-sm">vs {match.opponent?.name || t('Unknown')}</p>
                                                    <p className="text-xs text-slate-500">{match.date}</p>
                                                </div>
                                            </div>
                                            {match.opponent && (
                                                <img src={match.opponent.avatar || `https://ui-avatars.com/api/?name=${match.opponent.name}`} className="h-8 w-8 rounded-full opacity-50" />
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-slate-500 bg-white/5 rounded-2xl border border-dashed border-white/10">
                                        {t('No recent matches played')}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-10 flex w-full gap-4">
                            <button
                                onClick={copyLink}
                                className="group flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 py-4 font-bold transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
                            >
                                <svg className="h-5 w-5 text-slate-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                {t('Share Profile')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer / Join CTA */}
                {!auth.user && (
                    <div className="mt-16 text-center animate-fade-in-up">
                        <p className="mb-6 text-slate-400 font-medium">{t('Think you can beat them?')}</p>
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-10 py-4 text-lg font-bold text-white shadow-xl shadow-blue-600/30 transition-transform hover:scale-105 hover:shadow-blue-600/40"
                        >
                            {t('Create Account')}
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
