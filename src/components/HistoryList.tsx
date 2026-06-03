/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { DrawHistoryItem } from '../types';
import { Trash, Calendar, History, ShieldAlert } from 'lucide-react';

interface HistoryListProps {
  history: DrawHistoryItem[];
  onClearHistory: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onClearHistory }) => {
  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-amber-500" />
          <h3 className="font-semibold text-slate-100 font-display text-base">
            歷史中獎紀錄 ({history.length})
          </h3>
        </div>
        
        {history.length > 0 && (
          <button
            id="btn_clear_history"
            onClick={onClearHistory}
            className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-medium bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
          >
            <Trash className="w-3.5 h-3.5" />
            <span>清除全部</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center select-none text-slate-500">
          <History className="w-10 h-10 mb-2 opacity-25" />
          <p className="text-sm">尚未有任何中獎紀錄</p>
          <p className="text-xs text-slate-600 mt-1">開始旋轉轉盤後，得主將記錄於此</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1 max-h-[280px] space-y-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {history.map((item, index) => {
            const dateStr = new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 bg-slate-950/40 border border-slate-800/60 rounded-xl hover:border-slate-700/60 hover:bg-slate-950/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Order numbering */}
                  <span className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-800 text-slate-400 font-mono text-xs font-semibold">
                    {history.length - index}
                  </span>
                  
                  <div>
                    <p className="text-slate-200 font-semibold font-display text-sm">{item.winnerName}</p>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{dateStr}</span>
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                {item.removedFromList ? (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-red-400/90 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/10">
                    <ShieldAlert className="w-3 h-3" />
                    已剔除
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] uppercase font-bold text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/10">
                    保留中
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
