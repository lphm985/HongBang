

import React, { useState, useEffect } from 'react';
import type { InspectPlayer } from '../types';
import { REALMS, TECHNIQUES, SPIRITUAL_ROOTS, formatNumber } from '../constants';

const API_BASE_URL = '/api';

interface PlayerInspectModalProps {
  playerName: string;
  token: string;
  onClose: () => void;
}

const PlayerInspectModal: React.FC<PlayerInspectModalProps> = ({ playerName, token, onClose }) => {
  const [playerData, setPlayerData] = useState<InspectPlayer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayerData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/player/${encodeURIComponent(playerName)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Không thể lấy thông tin đạo hữu này.');
        }
        const data: InspectPlayer = await response.json();
        setPlayerData(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerData();
  }, [playerName, token]);

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-slate-400">Đang quan sát...</p>;
    }
    if (error) {
      return <p className="text-red-400">{error}</p>;
    }
    if (playerData) {
      const realmName = REALMS[playerData.realmIndex]?.name || 'Không rõ';
      const activeTechnique = TECHNIQUES.find(t => t.id === playerData.activeTechniqueId);
      const spiritualRoot = SPIRITUAL_ROOTS.find(r => r.id === playerData.spiritualRoot);

      return (
        <div className="space-y-4 text-lg">
          <div className="flex justify-between items-baseline">
            <span className="text-slate-400">Tu Vi:</span>
            <span className="font-bold text-emerald-400">{realmName}</span>
          </div>
          {spiritualRoot && (
            <div className="flex justify-between items-baseline">
                <span className="text-slate-400">Linh Căn:</span>
                <span className="font-bold text-yellow-300">{spiritualRoot.name}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline">
            <span className="text-slate-400">Ác Nghiệp:</span>
            <span className="font-bold text-purple-400">{playerData.karma}</span>
          </div>
          <div className="border-t border-slate-600 my-2"></div>
          <div className="flex justify-between items-baseline">
            <span className="text-slate-400">Sinh Lực (HP):</span>
            <span className="font-bold text-red-400">{formatNumber(playerData.calculatedHp)}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-slate-400">Công Kích (ATK):</span>
            <span className="font-bold text-orange-400">{formatNumber(playerData.calculatedAtk)}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-slate-400">Phòng Ngự (DEF):</span>
            <span className="font-bold text-sky-400">{formatNumber(playerData.calculatedDef)}</span>
          </div>
           <div className="border-t border-slate-600 my-2"></div>
          <div className="flex justify-between items-baseline">
            <span className="text-slate-400">Công Pháp:</span>
            <span className="font-bold text-cyan-300">{activeTechnique?.name || 'Không vận chuyển'}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-md m-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-slate-600 pb-3 mb-4">
          <h2 className="text-2xl font-semibold text-cyan-300">Quan Sát: {playerName}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
        </div>
        <div>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default PlayerInspectModal;