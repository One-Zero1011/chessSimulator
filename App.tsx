import React, { useState } from 'react';
import { MBTI, PlayerProfile } from './types';
import { PlayerSetup } from './components/PlayerSetup';
import { GameView } from './components/GameView';
import { Button } from './components/Button';
import { Swords, Link2, Link2Off } from 'lucide-react';
import { MUTUAL_RELATIONSHIP_MAP } from './constants';

const INITIAL_PLAYER_1: PlayerProfile = {
  id: 'p1',
  name: '앨리스',
  mbti: MBTI.INTJ,
  relationship: '라이벌',
  avatarUrl: 'https://picsum.photos/200',
  elo: 50
};

const INITIAL_PLAYER_2: PlayerProfile = {
  id: 'p2',
  name: '밥',
  mbti: MBTI.ESFP,
  relationship: '라이벌',
  avatarUrl: 'https://picsum.photos/201',
  elo: 50
};

export default function App() {
  const [step, setStep] = useState<'setup' | 'game'>('setup');
  const [player1, setPlayer1] = useState<PlayerProfile>(INITIAL_PLAYER_1);
  const [player2, setPlayer2] = useState<PlayerProfile>(INITIAL_PLAYER_2);
  const [isMutualRelationship, setIsMutualRelationship] = useState(true);

  const updatePlayer1 = (field: keyof PlayerProfile, value: any) => {
    setPlayer1(prev => ({ ...prev, [field]: value }));

    // Auto-sync relationship if in mutual mode
    if (isMutualRelationship && field === 'relationship') {
      const reciprocal = MUTUAL_RELATIONSHIP_MAP[value] || value;
      setPlayer2(prev => ({ ...prev, relationship: reciprocal }));
    }
  };

  const updatePlayer2 = (field: keyof PlayerProfile, value: any) => {
    setPlayer2(prev => ({ ...prev, [field]: value }));

    // Auto-sync relationship if in mutual mode
    if (isMutualRelationship && field === 'relationship') {
      const reciprocal = MUTUAL_RELATIONSHIP_MAP[value] || value;
      setPlayer1(prev => ({ ...prev, relationship: reciprocal }));
    }
  };

  const toggleRelationshipMode = () => {
    const newMode = !isMutualRelationship;
    setIsMutualRelationship(newMode);
    
    // When switching to mutual, sync player 2 to player 1's reciprocal
    if (newMode) {
      const reciprocal = MUTUAL_RELATIONSHIP_MAP[player1.relationship] || player1.relationship;
      setPlayer2(prev => ({ ...prev, relationship: reciprocal }));
    }
  };

  const startGame = () => {
    setStep('game');
  };

  const resetGame = () => {
    setStep('setup');
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-zinc-900 selection:text-white">
      
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center shadow-lg shadow-zinc-900/10">
              <Swords className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-zinc-900 tracking-tight">
              체스소나
            </h1>
          </div>
          <div className="text-xs text-zinc-500 font-mono border border-zinc-200 px-2 py-1 rounded-md">
            Powered by Stockfish
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        {step === 'setup' ? (
          <div className="max-w-4xl mx-auto mt-8 animate-fade-in">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-zinc-900 mb-2 tracking-tight">시뮬레이션 설정</h2>
              <p className="text-zinc-500">체스판 위에서 대결할 두 성격을 설정하세요.</p>
            </div>

            {/* Relationship Mode Toggle */}
            <div className="flex justify-center mb-6">
              <button
                onClick={toggleRelationshipMode}
                className="group flex items-center gap-3 bg-white px-5 py-2.5 rounded-full shadow-sm border border-zinc-200 hover:border-zinc-300 transition-all"
              >
                <div className={`p-1.5 rounded-full transition-colors ${isMutualRelationship ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                  <Link2 className="w-4 h-4" />
                </div>
                <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-bold text-zinc-900">
                      {isMutualRelationship ? '쌍방향 관계 (자동 동기화)' : '일방향 관계 (개별 설정)'}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {isMutualRelationship ? '한 쪽을 바꾸면 상대방도 바뀝니다.' : '각자 서로를 어떻게 생각하는지 따로 설정합니다.'}
                    </span>
                </div>
                <div className={`p-1.5 rounded-full transition-colors ${!isMutualRelationship ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                   <Link2Off className="w-4 h-4" />
                </div>
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8 relative">
              <PlayerSetup 
                label="백색 플레이어" 
                player={player1} 
                onChange={updatePlayer1} 
              />

              {/* Connector Visual (Mobile Hidden) */}
              {isMutualRelationship && (
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-white border border-zinc-200 p-2 rounded-full shadow-lg">
                   <Link2 className="w-5 h-5 text-zinc-400" />
                </div>
              )}

              <PlayerSetup 
                label="흑색 플레이어" 
                player={player2} 
                onChange={updatePlayer2} 
              />
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={startGame} 
                className="px-8 py-3 text-lg flex items-center gap-2 transform hover:scale-105"
              >
                <Swords className="w-5 h-5" /> 매치 시작
              </Button>
            </div>
          </div>
        ) : (
          <GameView 
            whitePlayer={player1} 
            blackPlayer={player2} 
            onReset={resetGame} 
          />
        )}
      </main>

    </div>
  );
}