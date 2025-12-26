import React from 'react';
import { MBTI, PlayerProfile } from '../types';
import { User, Activity, Heart, Upload } from 'lucide-react';
import { RELATIONSHIP_OPTIONS } from '../constants';

interface PlayerSetupProps {
  label: string;
  player: PlayerProfile;
  onChange: (field: keyof PlayerProfile, value: any) => void;
  disabledRelationship?: boolean;
}

export const PlayerSetup: React.FC<PlayerSetupProps> = ({ label, player, onChange, disabledRelationship = false }) => {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange('avatarUrl', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-xl shadow-zinc-200/50">
      <h3 className="text-xl font-bold text-zinc-900 mb-4 flex items-center gap-2">
        <User className="w-5 h-5" /> {label}
      </h3>
      
      <div className="flex flex-col items-center mb-6">
        <div className="relative group cursor-pointer">
          <img 
            src={player.avatarUrl} 
            alt={player.name} 
            className="w-24 h-24 rounded-full object-cover border-4 border-zinc-100 group-hover:border-zinc-300 transition-colors bg-zinc-100 shadow-inner" 
          />
          <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-full transition-opacity cursor-pointer">
            <Upload className="w-8 h-8" />
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageUpload} 
            />
          </label>
        </div>
        <p className="text-xs text-zinc-400 mt-2">이미지를 클릭하여 변경하세요</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-500 mb-1">이름</label>
          <input
            type="text"
            value={player.name}
            onChange={(e) => onChange('name', e.target.value)}
            className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:outline-none transition-shadow"
            placeholder="이름 입력"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-500 mb-1 flex items-center gap-1">
            <Activity className="w-4 h-4" /> MBTI 유형
          </label>
          <select
            value={player.mbti}
            onChange={(e) => onChange('mbti', e.target.value as MBTI)}
            className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:outline-none transition-shadow"
          >
            {Object.values(MBTI).map((mbti) => (
              <option key={mbti} value={mbti}>{mbti}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-500 mb-1 flex items-center gap-1">
            <Heart className="w-4 h-4" /> 상대방과의 관계
          </label>
          <select
            value={player.relationship}
            onChange={(e) => onChange('relationship', e.target.value)}
            disabled={disabledRelationship}
            className={`w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:border-transparent focus:outline-none transition-shadow ${disabledRelationship ? 'opacity-70 bg-zinc-50 cursor-not-allowed' : ''}`}
          >
             {RELATIONSHIP_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div>
           <label className="block text-sm font-medium text-zinc-500 mb-1">스톡피쉬 실력 (1-100)</label>
            <input 
                type="range" 
                min="1" 
                max="100" 
                value={player.elo} 
                onChange={(e) => onChange('elo', parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
            />
            <div className="text-right text-xs text-zinc-400 mt-1">레벨: {player.elo}</div>
        </div>
      </div>
    </div>
  );
};