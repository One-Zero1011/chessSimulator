
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { PlayerProfile, GameLogEntry, Emotion } from '../types';
import { stockfish } from '../services/stockfishService';
import { generateDialogue, DialogueSituation } from '../services/dialogueGenerator';
import { analyzeMoveTactics, TacticResult } from '../utils/tactics';
import { getBeginnerExplanation, calculateAdvantage, GameExplanation } from '../utils/gameExplanation';
import { MBTI_TRAITS } from '../constants';
import { Play, Pause, RotateCcw, MessageSquare, Swords, Zap, Info, TrendingUp, BarChart3, HelpCircle } from 'lucide-react';
import { Button } from './Button';

interface GameViewProps {
  whitePlayer: PlayerProfile;
  blackPlayer: PlayerProfile;
  onReset: () => void;
}

// Cast Chessboard to any to avoid type issues with react-chessboard
const SafeChessboard = Chessboard as any;

export const GameView: React.FC<GameViewProps> = ({ whitePlayer, blackPlayer, onReset }) => {
  const [game, setGame] = useState(new Chess());
  const [currentFen, setCurrentFen] = useState("start");
  const [isPlaying, setIsPlaying] = useState(false);
  const [logs, setLogs] = useState<GameLogEntry[]>([]);
  const processingRef = useRef(false);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Tactics & Visuals
  const [tacticAlert, setTacticAlert] = useState<TacticResult | null>(null);
  const [customSquareStyles, setCustomSquareStyles] = useState<Record<string, React.CSSProperties>>({});

  // Beginner Guide State
  const [gameExplanation, setGameExplanation] = useState<GameExplanation>({
    title: "게임 시작",
    description: "양측이 첫 수를 고민하고 있습니다.",
    advantage: 0,
    status: 'equal'
  });

  // Emotions
  const [whiteEmotion, setWhiteEmotion] = useState<Emotion>('neutral');
  const [blackEmotion, setBlackEmotion] = useState<Emotion>('neutral');
  
  const whiteTimeoutRef = useRef<number | null>(null);
  const blackTimeoutRef = useRef<number | null>(null);
  const tacticTimeoutRef = useRef<number | null>(null);

  // Modern monochrome board style
  const customDarkSquareStyle = useMemo(() => ({ backgroundColor: '#52525b' }), []); // Zinc 600
  const customLightSquareStyle = useMemo(() => ({ backgroundColor: '#e4e4e7' }), []); // Zinc 200

  const addLog = (playerId: string, message: string, type: 'move' | 'chat' | 'system', emotion?: Emotion) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      playerId,
      message,
      timestamp: Date.now(),
      type,
      emotion
    }]);
  };

  // Auto-scroll logs container to bottom when logs change
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    const newGame = new Chess();
    setGame(newGame);
    setCurrentFen("start");
    setLogs([]);
    setIsPlaying(false);
    setTacticAlert(null);
    setCustomSquareStyles({});
    setGameExplanation({
        title: "게임 시작",
        description: "양측이 첫 수를 고민하고 있습니다.",
        advantage: 0,
        status: 'equal'
    });
    
    // Reset emotions and clear timeouts
    setWhiteEmotion('neutral');
    setBlackEmotion('neutral');
    if (whiteTimeoutRef.current !== null) clearTimeout(whiteTimeoutRef.current);
    if (blackTimeoutRef.current !== null) clearTimeout(blackTimeoutRef.current);
    
    processingRef.current = false;
  }, [onReset]);

  // Helper to trigger temporary emotion with timeout cleanup
  const triggerEmotion = (playerColor: 'w' | 'b', emotion: Emotion, duration = 2500) => {
    if (playerColor === 'w') {
        if (whiteTimeoutRef.current !== null) clearTimeout(whiteTimeoutRef.current);
        setWhiteEmotion(emotion);
        whiteTimeoutRef.current = window.setTimeout(() => setWhiteEmotion('neutral'), duration);
    } else {
        if (blackTimeoutRef.current !== null) clearTimeout(blackTimeoutRef.current);
        setBlackEmotion(emotion);
        blackTimeoutRef.current = window.setTimeout(() => setBlackEmotion('neutral'), duration);
    }
  };

  const makeMove = useCallback(async () => {
    if (game.isGameOver() || game.isDraw() || !isPlaying || processingRef.current) return;

    processingRef.current = true;

    const turn = game.turn();
    const currentPlayer = turn === 'w' ? whitePlayer : blackPlayer;
    const opponentPlayer = turn === 'w' ? blackPlayer : whitePlayer;
    const isWhite = turn === 'w';

    try {
      const trait = MBTI_TRAITS[currentPlayer.mbti];
      const contempt = trait ? trait.contempt : 0;

      // Stockfish returns { move, evaluation }
      const stockfishResult = await stockfish.getBestMove(game.fen(), currentPlayer.elo, contempt);
      const bestMove = stockfishResult.move;
      
      const gameCopy = new Chess(game.fen());
      
      const from = bestMove.substring(0, 2);
      const to = bestMove.substring(2, 4);
      const promotionChar = bestMove.length > 4 ? bestMove.substring(4, 5) : undefined;
      const moveConfig: any = { from, to, promotion: promotionChar };

      let moveResult;
      try {
        moveResult = gameCopy.move(moveConfig);
      } catch (e) {
        try { moveResult = gameCopy.move(bestMove); } catch (e2) {}
      }
      
      if (moveResult) {
        const newFen = gameCopy.fen();
        
        // --- Beginner Guide Update ---
        const advantage = calculateAdvantage(stockfishResult.evaluation, turn); // Pass current turn to normalize
        const explanation = getBeginnerExplanation(gameCopy, moveResult, advantage);
        setGameExplanation(explanation);

        // --- Tactics Analysis & Visualization ---
        const tactic = analyzeMoveTactics(gameCopy, moveResult);
        const newSquareStyles: Record<string, React.CSSProperties> = {};
        
        // Highlight move source/dest
        newSquareStyles[moveResult.from] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
        newSquareStyles[moveResult.to] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };

        // Highlight Check
        if (gameCopy.inCheck()) {
           const kingSquare = gameCopy.board().flat().find((p) => p && p.type === 'k' && p.color === gameCopy.turn())?.square;
           if (kingSquare) {
             newSquareStyles[kingSquare] = { 
               boxShadow: 'inset 0 0 10px 4px rgba(220, 38, 38, 0.8)',
               animation: 'pulse-red 1s infinite'
             };
           }
        }

        if (tactic) {
          setTacticAlert(tactic);
          // Highlight tactic squares
          tactic.squaresToHighlight.forEach(sq => {
            newSquareStyles[sq] = { 
                ...newSquareStyles[sq],
                boxShadow: 'inset 0 0 15px rgba(255, 255, 255, 0.8), 0 0 10px rgba(0,0,0,0.5)',
                backgroundColor: 'rgba(255,255,255,0.2)'
            };
          });

          // Auto clear tactic after 2s
          if (tacticTimeoutRef.current) clearTimeout(tacticTimeoutRef.current);
          tacticTimeoutRef.current = window.setTimeout(() => setTacticAlert(null), 2000);
        }

        setCustomSquareStyles(newSquareStyles);
        setGame(gameCopy);
        setCurrentFen(newFen);
        addLog(currentPlayer.id, `${moveResult.san}${tactic ? ` [${tactic.name}]` : ''}`, 'move');

        // Logic for Emotion & Dialogue
        let situation: DialogueSituation = 'generic';
        let attackerEmotion: Emotion = 'neutral';
        let defenderEmotion: Emotion = 'neutral';

        // Evaluate State
        if (gameCopy.isCheckmate()) {
          situation = 'winning';
          attackerEmotion = 'happy';
          defenderEmotion = 'sad'; 
        } else if (gameCopy.inCheck()) {
          situation = 'check';
          // Aggressive types get happy/angry on check
          attackerEmotion = trait.contempt > 20 ? 'angry' : 'happy';
          defenderEmotion = 'fearful'; 
        } else if (moveResult.captured) {
          situation = 'capture';
          attackerEmotion = 'happy';
          defenderEmotion = 'anxious';
        } else if (gameCopy.history().length < 6) {
          situation = 'opening';
          attackerEmotion = 'neutral';
        } else {
          // Random chance for emotional outburst if generic
          if (Math.random() < 0.1) {
             const possibleEmotions: ('angry' | 'happy')[] = ['angry', 'happy'];
             const picked = possibleEmotions[trait.contempt > 30 ? 0 : 1];
             situation = picked;
             attackerEmotion = picked;
          }
        }

        // Apply Emotions
        if (attackerEmotion !== 'neutral') triggerEmotion(isWhite ? 'w' : 'b', attackerEmotion);
        if (defenderEmotion !== 'neutral') triggerEmotion(isWhite ? 'b' : 'w', defenderEmotion);

        // Generate Dialogue (Active Player)
        let dialogueKey: DialogueSituation = situation;
        if (['check', 'capture', 'winning'].includes(situation) && attackerEmotion !== 'neutral' && Math.random() > 0.5) {
            dialogueKey = attackerEmotion as DialogueSituation; 
        }

        const dialogue = generateDialogue(
          currentPlayer.mbti, 
          dialogueKey, 
          opponentPlayer.name, 
          currentPlayer.relationship
        );
        
        if (dialogue) {
           setTimeout(() => {
             addLog(currentPlayer.id, dialogue, 'chat', attackerEmotion);
           }, 500);
        }

        // Reactive Dialogue (Passive Player)
        if (defenderEmotion !== 'neutral' && Math.random() > 0.7) {
            const reaction = generateDialogue(
                opponentPlayer.mbti,
                defenderEmotion as DialogueSituation, 
                currentPlayer.name,
                opponentPlayer.relationship
            );
            if (reaction) {
                setTimeout(() => {
                    addLog(opponentPlayer.id, reaction, 'chat', defenderEmotion);
                }, 1500);
            }
        }

        if (gameCopy.isGameOver()) {
          setIsPlaying(false);
          let resultMsg = "";
          if (gameCopy.isCheckmate()) resultMsg = `${currentPlayer.name} 승리 (체크메이트)`;
          else if (gameCopy.isDraw()) resultMsg = "무승부";
          else resultMsg = "게임 종료";
          addLog('system', resultMsg, 'system');
        }
      }
    } catch (error) {
      console.error("Move error:", error);
    } finally {
      processingRef.current = false;
    }
  }, [game, isPlaying, whitePlayer, blackPlayer]);

  useEffect(() => {
    if (isPlaying) {
      const timeout = setTimeout(makeMove, 1200); 
      return () => clearTimeout(timeout);
    }
  }, [isPlaying, game, makeMove]);

  // Animation Helper Class
  const getAvatarClass = (emotion: Emotion) => {
    switch (emotion) {
        case 'happy': return 'animate-bounce ring-4 ring-green-400';
        case 'sad': return 'filter-blue-gray scale-95 transition-all duration-500';
        case 'angry': return 'animate-shake filter-sepia-red ring-4 ring-red-500';
        case 'fearful': return 'animate-shiver brightness-75';
        case 'anxious': return 'animate-pulse';
        default: return '';
    }
  };

  // Calculate advantage bar width (50% is equal)
  const advantagePercent = Math.min(100, Math.max(0, 50 + (gameExplanation.advantage)));

  return (
    <div className="flex flex-col xl:flex-row gap-6 justify-center p-4 min-h-[calc(100vh-6rem)] items-start">
      
      {/* Left Column: Beginner Guide & Analysis */}
      <div className="w-full xl:w-80 flex flex-col gap-4 order-2 xl:order-1 shrink-0 animate-fade-in delay-100">
         
         <div className="flex items-center gap-2 mb-2 px-2">
            <HelpCircle className="w-5 h-5 text-zinc-400" />
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">초보자 가이드</h3>
         </div>

         {/* Beginner Guide Tooltip */}
         <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-lg shadow-zinc-200/50 flex flex-col gap-3 relative overflow-hidden group transition-all hover:shadow-xl">
            <div className={`absolute top-0 left-0 w-1.5 h-full transition-colors duration-500 ${
                gameExplanation.status === 'white_winning' ? 'bg-zinc-300' :
                gameExplanation.status === 'black_winning' ? 'bg-zinc-800' :
                gameExplanation.status === 'check' ? 'bg-red-500' : 'bg-green-500'
            }`}></div>
            
            <div className="flex items-center gap-3 mb-1">
                <div className={`p-2.5 rounded-full shrink-0 transition-colors duration-500 ${
                     gameExplanation.status === 'check' ? 'bg-red-100' : 'bg-zinc-100'
                }`}>
                    {gameExplanation.status === 'check' || gameExplanation.status === 'mate' ? (
                        <Zap className="w-6 h-6 text-red-500" />
                    ) : gameExplanation.status === 'equal' ? (
                        <Info className="w-6 h-6 text-zinc-500" />
                    ) : (
                        <TrendingUp className="w-6 h-6 text-zinc-900" />
                    )}
                </div>
                <h4 className="font-bold text-lg text-zinc-900 leading-tight">
                    {gameExplanation.title}
                </h4>
            </div>
            
            <p className="text-zinc-600 leading-relaxed text-sm">
                {gameExplanation.description}
            </p>
        </div>

        {/* Advantage Bar Card */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-lg shadow-zinc-200/50 flex flex-col gap-3">
             <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">승률 분석</span>
             </div>
            
            <div className="h-6 bg-zinc-200 rounded-md overflow-hidden flex relative shadow-inner border border-zinc-300">
                <div 
                    className="h-full bg-zinc-900 transition-all duration-1000 ease-in-out relative flex items-center justify-start px-2"
                    style={{ width: '100%' }} 
                >
                   <span className="text-[10px] font-bold text-white">흑색</span>
                </div>
                <div 
                    className="absolute top-0 left-0 h-full bg-white transition-all duration-1000 ease-in-out border-r border-zinc-300 flex items-center justify-end px-2"
                    style={{ width: `${advantagePercent}%` }}
                >
                   <span className="text-[10px] font-bold text-zinc-400">백색</span>
                </div>
                {/* Center marker */}
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-red-500/50 -translate-x-1/2 z-10"></div>
            </div>
             <div className="flex justify-between items-center text-xs font-mono mt-1">
                 <span className={`${gameExplanation.advantage < 0 ? 'text-zinc-900 font-bold' : 'text-zinc-400'}`}>
                    Black {advantagePercent < 50 ? `${(100 - advantagePercent).toFixed(0)}%` : ''}
                 </span>
                 <span className="text-zinc-300">|</span>
                 <span className={`${gameExplanation.advantage > 0 ? 'text-zinc-900 font-bold' : 'text-zinc-400'}`}>
                    White {advantagePercent > 50 ? `${advantagePercent.toFixed(0)}%` : ''}
                 </span>
            </div>
        </div>

      </div>

      {/* Center Column: Board */}
      <div className="flex-1 flex flex-col justify-center items-center gap-4 w-full max-w-[600px] order-1 xl:order-2 relative">
         
         {/* Tactic Overlay */}
         {tacticAlert && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none w-full flex flex-col items-center justify-center">
                <div className={`relative px-8 py-4 transform skew-x-[-10deg] shadow-2xl animate-tactic-pop ${tacticAlert.color}`}>
                   <div className="absolute inset-0 bg-white/20 animate-slash"></div>
                   <h2 className={`text-5xl font-black italic tracking-tighter drop-shadow-md ${tacticAlert.name === "CHECKMATE" ? "glitch" : ""}`} data-text={tacticAlert.name}>
                     {tacticAlert.name}
                   </h2>
                   <p className="text-sm font-bold uppercase tracking-widest mt-1 text-center opacity-90">{tacticAlert.description}</p>
                </div>
            </div>
         )}

         {/* Top Player (Black) */}
        <div className={`w-full flex items-center justify-between bg-white p-3 px-5 rounded-xl border transition-colors duration-300 shadow-sm ${blackEmotion === 'angry' ? 'border-red-500 bg-red-50' : 'border-zinc-200'}`}>
           <div className="flex items-center gap-3">
             <div className="relative">
                <div className="w-4 h-4 rounded-full bg-zinc-900 border border-zinc-700 shadow-sm"></div>
                {game.turn() === 'b' && isPlaying && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                )}
             </div>
             <div>
                <span className="font-bold text-zinc-900 block leading-none">{blackPlayer.name}</span>
                <span className="text-xs text-zinc-500 font-mono">Rating: {blackPlayer.elo}</span>
             </div>
           </div>
           {game.turn() === 'b' && isPlaying && <div className="text-xs text-zinc-500 font-bold animate-pulse bg-zinc-100 px-2 py-1 rounded">Thinking...</div>}
        </div>

        {/* Board */}
        <div className="w-full bg-white rounded-xl shadow-2xl p-3 shrink-0 border border-zinc-200 relative z-10">
            <div className="aspect-square w-full">
              <SafeChessboard 
                position={currentFen}
                arePiecesDraggable={false}
                customDarkSquareStyle={customDarkSquareStyle}
                customLightSquareStyle={customLightSquareStyle}
                customSquareStyles={customSquareStyles}
                animationDuration={300}
              />
            </div>
            {game.inCheck() && (
                <div className="absolute inset-0 pointer-events-none rounded-xl border-[6px] border-red-500/50 animate-pulse z-10"></div>
            )}
        </div>

         {/* Bottom Player (White) */}
         <div className={`w-full flex items-center justify-between bg-white p-3 px-5 rounded-xl border transition-colors duration-300 shadow-sm ${whiteEmotion === 'angry' ? 'border-red-500 bg-red-50' : 'border-zinc-200'}`}>
           <div className="flex items-center gap-3">
             <div className="relative">
                <div className="w-4 h-4 rounded-full bg-white border-2 border-zinc-300 shadow-sm"></div>
                 {game.turn() === 'w' && isPlaying && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                )}
             </div>
             <div>
                <span className="font-bold text-zinc-900 block leading-none">{whitePlayer.name}</span>
                <span className="text-xs text-zinc-500 font-mono">Rating: {whitePlayer.elo}</span>
             </div>
           </div>
           {game.turn() === 'w' && isPlaying && <div className="text-xs text-zinc-500 font-bold animate-pulse bg-zinc-100 px-2 py-1 rounded">Thinking...</div>}
        </div>
      </div>

      {/* Right Column: Visuals & Logs */}
      <div className="w-full xl:w-96 flex flex-col gap-4 order-3 h-full">
        
        {/* Character Visuals */}
        <div className="flex gap-4 shrink-0 items-end">
            {/* White Player */}
            <div className="flex-1 flex flex-col gap-2">
                <div className="text-center">
                    <div className="text-zinc-900 font-bold text-sm truncate">{whitePlayer.name}</div>
                    <div className="text-zinc-500 text-[10px] font-mono">{whitePlayer.mbti}</div>
                </div>
                <div className="relative aspect-[4/5] w-full group rounded-2xl overflow-hidden border-2 border-zinc-200 shadow-md bg-white">
                    <img
                        src={whitePlayer.avatarUrl}
                        alt={whitePlayer.name}
                        className={`w-full h-full object-cover transition-transform ${getAvatarClass(whiteEmotion)}`}
                    />
                    {whiteEmotion !== 'neutral' && (
                        <div className="absolute top-2 right-2 bg-white/90 text-zinc-900 text-xs px-2 py-1 rounded-full uppercase font-bold animate-fade-in z-10 shadow-sm">
                            {whiteEmotion}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-1 pb-8">
                <Swords className={`w-6 h-6 text-zinc-300 ${isPlaying ? 'animate-pulse text-red-500' : ''}`} />
            </div>

            {/* Black Player */}
            <div className="flex-1 flex flex-col gap-2">
                 <div className="text-center">
                    <div className="text-zinc-900 font-bold text-sm truncate">{blackPlayer.name}</div>
                    <div className="text-zinc-500 text-[10px] font-mono">{blackPlayer.mbti}</div>
                </div>
                <div className="relative aspect-[4/5] w-full group rounded-2xl overflow-hidden border-2 border-zinc-900 shadow-md bg-zinc-900">
                    <img
                        src={blackPlayer.avatarUrl}
                        alt={blackPlayer.name}
                        className={`w-full h-full object-cover transition-transform ${getAvatarClass(blackEmotion)}`}
                    />
                     {blackEmotion !== 'neutral' && (
                        <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full uppercase font-bold animate-fade-in z-10">
                            {blackEmotion}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Logs */}
        <div className="h-[350px] bg-white rounded-xl border border-zinc-200 overflow-hidden flex flex-col shadow-lg shadow-zinc-200/50">
          <div className="p-3 border-b border-zinc-100 bg-zinc-50/50 backdrop-blur shrink-0 flex justify-between items-center">
            <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-zinc-500" /> 로그
            </h3>
          </div>
          <div ref={logsContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-white scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-transparent">
            {logs.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400 space-y-2 opacity-50">
                    <p className="text-sm italic">대기 중...</p>
                </div>
            )}
            {logs.map((log) => {
              const isSystem = log.type === 'system';
              const isChat = log.type === 'chat';
              const player = log.playerId === whitePlayer.id ? whitePlayer : blackPlayer;
              
              if (isSystem) {
                return (
                  <div key={log.id} className="text-center text-xs text-zinc-500 font-mono py-1 border-y border-zinc-100 my-1 bg-zinc-50">
                    {log.message}
                  </div>
                );
              }

              return (
                <div key={log.id} className={`flex flex-col ${log.playerId === whitePlayer.id ? 'items-start' : 'items-end'}`}>
                  {isChat ? (
                    <div className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm shadow-sm relative border ${
                      log.playerId === whitePlayer.id 
                        ? 'bg-white text-zinc-900 rounded-tl-none border-zinc-200 shadow-sm' 
                        : 'bg-zinc-900 text-white rounded-tr-none border-zinc-800 shadow-md'
                    } ${log.emotion === 'angry' ? 'border-red-500/50 ring-1 ring-red-500/20' : ''}`}>
                      <span className={`text-[10px] opacity-70 block mb-1 uppercase tracking-wider font-bold flex items-center gap-2 ${
                          log.playerId === whitePlayer.id ? 'text-zinc-500' : 'text-zinc-400'
                      }`}>
                          {player.name}
                          {log.emotion && <span className={`text-[9px] px-1 rounded ${log.playerId === whitePlayer.id ? 'bg-zinc-100' : 'bg-zinc-800'}`}>{log.emotion}</span>}
                      </span>
                      {log.message}
                    </div>
                  ) : (
                    <div className="text-[10px] font-mono text-zinc-500 px-2 py-1 bg-zinc-50 rounded flex items-center gap-1 border border-zinc-100">
                       <span className={`w-1.5 h-1.5 rounded-full ${log.playerId === whitePlayer.id ? 'bg-zinc-300' : 'bg-zinc-900'}`}></span>
                       {log.message}
                       {log.message.includes('[') && <Zap className="w-3 h-3 text-yellow-500" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 flex flex-col gap-3 shadow-lg shadow-zinc-200/50 shrink-0">
          <div className="flex gap-2">
            {!isPlaying ? (
               <Button onClick={() => setIsPlaying(true)} fullWidth className="flex items-center justify-center gap-2 py-3 text-lg">
                 <Play className="w-5 h-5" /> 시작
               </Button>
            ) : (
              <Button onClick={() => setIsPlaying(false)} variant="secondary" fullWidth className="flex items-center justify-center gap-2 py-3 text-lg">
                 <Pause className="w-5 h-5" /> 일시정지
               </Button>
            )}
            <Button onClick={onReset} variant="danger" className="flex items-center justify-center px-4">
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
