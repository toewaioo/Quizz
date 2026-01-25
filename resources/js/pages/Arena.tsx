import ArenaHeader from '@/components/ArenaHeader';
import GameOverDisplay from '@/components/arena/GameOverDisplay';
import MatchFoundState from '@/components/arena/MatchFoundState';
import QuestionDisplay from '@/components/arena/QuestionDisplay';
import WaitingState from '@/components/arena/WaitingState';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { useGameEngine } from '@/hooks/useGameEngine';
import { Head, usePage } from '@inertiajs/react';
import { ChannelProvider, useChannel, usePresence, usePresenceListener } from 'ably/react';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SharedData } from '../types';

// Wrapper to provide Ably Context
export default function ArenaPage({ match, ably_key }: { match: any; ably_key: string }) {
    // We use the global Ably client provided by GlobalAblyProvider
    return (
        <ChannelProvider channelName={`match:${match.channel_id}`}>
            <ChannelProvider channelName="global-presence">
                <Arena match={match} />
            </ChannelProvider>
        </ChannelProvider>
    );
}

function Arena({ match }: { match: any }) {
    const user = usePage<SharedData>().props.auth.user;
    const { t } = useTranslation();

    // Determine initial opponent (if P2 joins, P1 is opponent)
    // We prefer the state.opponent (from realtime events) if available,
    // otherwise fallback to prop (initial load for P2) or null (initial load for P1)
    const initialOpponent = match.player1_id === user.id ? match.player2 : match.player1;

    const isHost = Number(match.player1_id) === Number(user.id);

    // Use Game Engine Hook
    const { state, startGame, submitAnswer, nextQuestion, requestRematch } = useGameEngine(match.id, match.channel_id, user.id, isHost);

    // Effective Opponent
    const opponent = state.opponent || initialOpponent;

    // Presence Logic for "Opponent Online" status in the match channel
    usePresence(`match:${match.channel_id}`);
    const { presenceData } = usePresenceListener(`match:${match.channel_id}`);
    const [opponentPresent, setOpponentPresent] = useState(false);

    useEffect(() => {
        const isOpponentHere = presenceData.some((p: any) => p.clientId === String(opponent?.id));
        setOpponentPresent(isOpponentHere);
    }, [presenceData, opponent]);

    // Handle Global Presence Status (Playing)
    const { channel: globalChannel } = useChannel('global-presence');

    useEffect(() => {
        if (globalChannel) {
            // Update status to playing
            globalChannel.presence.update({
                name: user.name,
                id: user.id,
                profile_photo_url: user.profile_photo_url,
                status: 'playing',
            });

            return () => {
                // Revert to online when leaving arena
                globalChannel.presence.update({
                    name: user.name,
                    id: user.id,
                    profile_photo_url: user.profile_photo_url,
                    status: 'online',
                });
            };
        }
    }, [globalChannel, user]);

    // Derived UI State
    const timer = state.timer;
    const currentQuestion = state.currentQuestion;
    const score = state.playerScores[match.player1_id === user.id ? 'p1' : 'p2'];
    const opponentScore = state.playerScores[match.player1_id === user.id ? 'p2' : 'p1'];

    const isWinner = state.winnerId === user.id;
    const isDraw = state.status === 'GAME_OVER' && !state.winnerId;

    return (
        <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-slate-950 font-sans text-white selection:bg-indigo-500 selection:text-white">
            <Head title="Arena" />

            {/* Ambient Background - Dynamic & Dark */}
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-[20%] -top-[20%] h-[800px] w-[800px] animate-pulse rounded-full bg-indigo-600/20 blur-[120px]" />
                <div className="absolute -bottom-[20%] -right-[20%] h-[800px] w-[800px] animate-pulse rounded-full bg-blue-600/20 blur-[120px] delay-1000" />
                <div className="absolute inset-0 bg-[url('/images/grid.svg')] bg-center opacity-10 [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
            </div>

            {/* Header / StatusBar */}
            <div className="z-10 mt-safe pt-4 w-full flex justify-center">
                <ArenaHeader
                    user={user}
                    opponent={opponent}
                    score={score}
                    opponentScore={opponentScore}
                    timer={timer}
                    currentQuestionIndex={currentQuestion?.round_index}
                    status={state.status}
                    opponentPresent={opponentPresent}
                />
            </div>

            {/* Main Game Area */}
            <div className="relative z-10 flex w-full max-w-2xl flex-1 flex-col justify-center px-4 pb-10">
                {/* Waiting State */}
                {state.status === 'WAITING_FOR_OPPONENT' && (
                    <WaitingState />
                )}

                {/* Starting State */}
                {state.status === 'STARTING' && (
                    <MatchFoundState />
                )}

                {/* Question / Result State */}
                {(state.status === 'QUESTION_ACTIVE' || state.status === 'ROUND_RESULT' || state.status === 'PREPARE_ROUND') && currentQuestion && (
                    <div className="w-full">
                        {state.status === 'PREPARE_ROUND' && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 rounded-3xl">
                                <div className="text-center animate-pulse">
                                    <h2 className="text-4xl font-black text-white uppercase tracking-widest drop-shadow-xl">{t('GET READY')}</h2>
                                    <p className="text-blue-300 font-bold mt-2">{t('Next round starting...')}</p>
                                </div>
                            </div>
                        )}
                        <QuestionDisplay
                            currentQuestion={currentQuestion}
                            status={state.status}
                            lastRoundResult={state.lastRoundResult}
                            hasAnswered={state.hasAnswered}
                            opponentAnswered={state.opponentAnswered}
                            submitAnswer={submitAnswer}
                            userAnswer={state.userAnswer}
                        />
                    </div>
                )}


                {/* Game Over State */}
                {state.status === 'GAME_OVER' && (
                    <GameOverDisplay
                        user={user}
                        opponent={opponent}
                        score={score}
                        opponentScore={opponentScore}
                        isWinner={isWinner}
                        isDraw={isDraw}
                        onRequestRematch={state.rematchRequested ? undefined : requestRematch}
                        rematchRequested={state.rematchRequested}
                        rematchByOpponent={state.rematchByOpponent}
                    />
                )}
            </div>
        </div>
    );
}
