import React from 'react';
import type { MatchHistoryItem } from '../types';

interface MatchDetailsModalProps {
  match: MatchHistoryItem | null;
  onClose: () => void;
}

const MatchDetailsModal: React.FC<MatchDetailsModalProps> = ({ match, onClose }) => {
  if (!match) return null;

  const getLogColor = (log: string): string => {
      if (log.includes('tấn công')) return 'text-slate-300';
      if (log.includes('nhận')) return 'text-yellow-400';
      return 'text-slate-400';
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl w-full max-w-lg m-4 flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 p-6 border-b border-slate-600">
          <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-semibold text-cyan-300">Chi Tiết Trận Đấu</h2>
                <p className="text-sm text-slate-400">
                    <span className={`font-bold ${match.won ? 'text-green-400' : 'text-red-400'}`}>
                        {match.won ? 'Chiến thắng' : 'Thất bại'}
                    </span>
                     {' '}vs {match.opponent}
                </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
          </div>
           <p className="text-md text-amber-300 italic mt-4">"{match.summary}"</p>
        </div>

        <div className="flex-grow p-6 overflow-y-auto">
            <h3 className="text-lg font-bold text-emerald-400 mb-3">Nhật Ký Chiến Đấu</h3>
            <ul className="space-y-1 text-sm font-mono">
                {match.log.map((line, index) => (
                    <li key={index} className={getLogColor(line)}>
                        {line}
                    </li>
                ))}
            </ul>
        </div>
      </div>
    </div>
  );
};

export default MatchDetailsModal;
