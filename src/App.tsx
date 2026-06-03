/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { WheelCanvas } from './components/WheelCanvas';
import { WinnerModal } from './components/WinnerModal';
import { HistoryList } from './components/HistoryList';
import { Participant, DrawHistoryItem } from './types';
import { getSliceColor } from './utils/colors';
import { sfx } from './utils/audio';
import { db } from './firebase';
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  limit, 
  deleteDoc, 
  getDocs,
  getDocFromServer,
  serverTimestamp 
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './utils/firebaseHelpers';
import { 
  Volume2, 
  VolumeX, 
  Sparkles, 
  RotateCcw, 
  Trash2, 
  Info, 
  Shuffle, 
  PlusCircle, 
  Clipboard, 
  Layout, 
  CheckCircle, 
  CloudLightning,
  CloudCheck
} from 'lucide-react';

// Preset configurations
const PRESETS = [
  {
    name: '數字 1-10 號',
    text: '1, 2, 3, 4, 5, 6, 7, 8, 9, 10'
  },
  {
    name: '數字 1-30 號',
    text: Array.from({ length: 30 }, (_, i) => i + 1).join(', ')
  },
  {
    name: '精選美味午餐 🍕',
    text: '壽司 🍣, 麻辣火鍋 🍲, 義大利麵 🍝, 白醬披薩 🍕, 椰汁咖哩 🍛, 美式漢堡 🍔, 銅盤烤肉 🥩, 豚骨拉麵 🍜, 港式蒸餃 🥟, 焗烤海鮮飯 🍛, 台式滷肉飯 🍚, 泰式打拋豬 🐷'
  },
  {
    name: '課堂驚喜獎勵 🎁',
    text: '免寫作業一次 📅, 課堂加權 5 分 🌟, 珍奶大杯一杯 🥤, 便當加超大雞腿 🍗, 自由選座位一天 💺, 提早 5 分鐘下課 🏃, 秘書精美小禮物 🎁, 午休免睡覺 🛌, 與校長開心合照 📸, 課外書自由閱讀 📚'
  },
  {
    name: '組別隨機抽 👥',
    text: '第一組, 第二組, 第三組, 第四組, 第五組, 第六組, 第七組, 第八組'
  }
];

export default function App() {
  // Local active typing text value
  const [inputText, setInputText] = useState('1, 2, 3, 4, 5, 6, 7, 8, 9, 10');
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'error'>('synced');

  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('draw_wheel_sound');
    return saved !== null ? saved === 'true' : true;
  });

  const [themeSelection, setThemeSelection] = useState<'vibrant' | 'pastel' | 'neon' | 'sunset' | 'cool'>('vibrant');
  const [removeAfterDraw, setRemoveAfterDraw] = useState(false);
  const [historyList, setHistoryList] = useState<DrawHistoryItem[]>([]);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);
  const [isWinnerModalOpen, setIsWinnerModalOpen] = useState(false);

  // Connection validation indicator on boot
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'wheel_configs', 'default'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.warn("Please check your Firebase configuration: User is offline.");
          setSyncStatus('error');
        }
      }
    }
    testConnection();
  }, []);

  // 1. Subscribe to real-time Wheel Settings inside Firestore
  useEffect(() => {
    const docRef = doc(db, 'wheel_configs', 'default');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        
        // Prevent local cursor disruption if focusing/typing actively
        if (!isTextareaFocused && data.inputText !== undefined) {
          setInputText(data.inputText);
        }
        if (data.themeSelection !== undefined) {
          setThemeSelection(data.themeSelection);
        }
        if (data.removeAfterDraw !== undefined) {
          setRemoveAfterDraw(data.removeAfterDraw);
        }
        setSyncStatus('synced');
      } else {
        // Document not present, bootstrap initialized default document
        setSyncStatus('syncing');
        const defaultDoc = {
          id: 'default',
          inputText: '1, 2, 3, 4, 5, 6, 7, 8, 9, 10',
          themeSelection: 'vibrant',
          removeAfterDraw: false,
          updatedAt: serverTimestamp(),
        };
        setDoc(docRef, defaultDoc)
          .then(() => setSyncStatus('synced'))
          .catch((err) => {
            setSyncStatus('error');
            handleFirestoreError(err, OperationType.WRITE, 'wheel_configs/default');
          });
      }
    }, (error) => {
      setSyncStatus('error');
      handleFirestoreError(error, OperationType.GET, 'wheel_configs/default');
    });

    return () => unsubscribe();
  }, [isTextareaFocused]);

  // 2. Subscribe to real-time History items inside Firestore
  useEffect(() => {
    const qSnapshot = query(
      collection(db, 'draw_results'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(qSnapshot, (snapshot) => {
      const items: DrawHistoryItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        let jsDate = new Date();
        if (data.timestamp) {
          try {
            jsDate = data.timestamp.toDate();
          } catch (e) {
            // Ignore format issues
          }
        }
        items.push({
          id: data.id,
          winnerName: data.winnerName || '',
          timestamp: jsDate,
          removedFromList: !!data.removedFromList,
        });
      });
      setHistoryList(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'draw_results');
    });

    return () => unsubscribe();
  }, []);

  // Update configurations remotely on database
  const pushConfigToCloud = async (text: string, theme: string, remove: boolean) => {
    setSyncStatus('syncing');
    try {
      await setDoc(doc(db, 'wheel_configs', 'default'), {
        id: 'default',
        inputText: text,
        themeSelection: theme,
        removeAfterDraw: remove,
        updatedAt: serverTimestamp(),
      });
      setSyncStatus('synced');
    } catch (e) {
      setSyncStatus('error');
      handleFirestoreError(e, OperationType.WRITE, 'wheel_configs/default');
    }
  };

  // Debounce helper to prevent input typing lag when updating Firestore
  useEffect(() => {
    const handler = setTimeout(() => {
      if (isTextareaFocused) {
        pushConfigToCloud(inputText, themeSelection, removeAfterDraw);
      }
    }, 850);

    return () => clearTimeout(handler);
  }, [inputText]);

  // Sync settings immediately when clicked toggled controls
  const handleToggleRemoveAfter = (val: boolean) => {
    setRemoveAfterDraw(val);
    pushConfigToCloud(inputText, themeSelection, val);
  };

  const handleToggleTheme = (theme: 'vibrant' | 'pastel' | 'neon' | 'sunset' | 'cool') => {
    setThemeSelection(theme);
    pushConfigToCloud(inputText, theme, removeAfterDraw);
  };

  // Compile input text into active visual sectors
  useEffect(() => {
    const parts = inputText
      .split(/[\n,，、;；]/)
      .map(name => name.trim())
      .filter(name => name.length > 0);

    const generated = parts.map((name, index) => ({
      id: `part-${index}-${name}`,
      name,
      weight: 1,
      color: getSliceColor(index, parts.length, themeSelection),
    }));

    setParticipants(generated);
  }, [inputText, themeSelection]);

  // Master click spin handler
  const handleTriggerSpin = () => {
    if (isSpinning || participants.length === 0) return;
    
    // Launch spin action
    const buttonElement = document.getElementById('btn_wheel_spin');
    if (buttonElement) {
      buttonElement.click();
    }
  };

  // Callback completed spin
  const handleSpinComplete = async (selectedWinner: Participant) => {
    setWinner(selectedWinner);
    setIsWinnerModalOpen(true);

    // Save winner result online to Firestore so everyone gets it immediately!
    const newResultId = `res-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    try {
      await setDoc(doc(db, 'draw_results', newResultId), {
        id: newResultId,
        winnerName: selectedWinner.name,
        timestamp: serverTimestamp(),
        removedFromList: removeAfterDraw,
      });

      // Handle auto-remove immediately
      if (removeAfterDraw) {
        removeParticipant(selectedWinner.id);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `draw_results/${newResultId}`);
    }
  };

  // Exclude drawing items after we close modal or when checked delete
  const removeParticipant = (sliceId: string) => {
    const targetIdx = participants.findIndex(p => p.id === sliceId);
    if (targetIdx === -1) return;

    const targetParticipant = participants[targetIdx];

    const parts = inputText
      .split(/[\n,，、;；]/)
      .map(name => name.trim())
      .filter(name => name.length > 0);

    let found = false;
    const filteredParts = parts.filter(name => {
      if (!found && name === targetParticipant.name) {
        found = true;
        return false;
      }
      return true;
    });

    const newStrText = filteredParts.join(', ');
    setInputText(newStrText);
    pushConfigToCloud(newStrText, themeSelection, removeAfterDraw);
  };

  const handleApplyPreset = (presetText: string) => {
    if (isSpinning) return;
    setInputText(presetText);
    pushConfigToCloud(presetText, themeSelection, removeAfterDraw);
  };

  const handleShuffleList = () => {
    if (isSpinning || participants.length === 0) return;
    const parts = inputText
      .split(/[\n,，、;；]/)
      .map(name => name.trim())
      .filter(name => name.length > 0);

    for (let i = parts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [parts[i], parts[j]] = [parts[j], parts[i]];
    }

    const shuffled = parts.join(', ');
    setInputText(shuffled);
    pushConfigToCloud(shuffled, themeSelection, removeAfterDraw);
  };

  const handleClearList = () => {
    if (isSpinning) return;
    setInputText('');
    pushConfigToCloud('', themeSelection, removeAfterDraw);
  };

  // Clear histories remotely inside Firestore
  const handleClearHistory = async () => {
    try {
      const qSnapshot = await getDocs(collection(db, 'draw_results'));
      qSnapshot.forEach((docSnap) => {
        deleteDoc(docSnap.ref).catch((err) => {
          handleFirestoreError(err, OperationType.DELETE, `draw_results/${docSnap.id}`);
        });
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'draw_results');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
      
      {/* Decorative top ambient backdrop */}
      <div className="absolute top-0 inset-x-0 h-[480px] bg-gradient-to-b from-blue-500/10 via-amber-500/5 to-transparent pointer-events-none" />

      {/* Main Grid container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 flex flex-col justify-between">
        
        {/* Header section */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-2 select-none border-b border-slate-900 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-rose-500 to-amber-500 rounded-2xl shadow-lg shadow-rose-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                雲端多玩家 &bull; 抽籤大轉盤
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                精緻物理減速模擬與 Firestore 雲端即時連線（所有人同步觀看結果）
              </p>
            </div>
          </div>

          {/* Connected indicators */}
          <div className="flex items-center gap-3">
            {/* Cloud synchronized state */}
            {syncStatus === 'synced' ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <CloudCheck className="w-3.5 h-3.5" />
                <span>雲端同步中 🟢</span>
              </div>
            ) : syncStatus === 'syncing' ? (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold animate-pulse">
                <CloudLightning className="w-3.5 h-3.5 animate-spin" />
                <span>同步儲存中...</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                <CloudLightning className="w-3.5 h-3.5" />
                <span>連線失敗 🔴</span>
              </div>
            )}

            {/* Audio speaker configurations */}
            <button
              id="btn_sound_toggle"
              onClick={() => {
                sfx.init();
                setSoundEnabled(!soundEnabled);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border cursor-pointer ${
                soundEnabled
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400 hover:bg-slate-800'
              }`}
              title={soundEnabled ? '關閉音效' : '開啟音效'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{soundEnabled ? '音效已開啟' : '靜音中'}</span>
            </button>
          </div>
        </header>

        {/* Action grids */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">
          
          {/* Setup controller configs columns */}
          <section id="section_setup" className="lg:col-span-5 space-y-6">
            
            {/* Participant options */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <label className="font-semibold text-slate-200 font-display text-base flex items-center gap-2">
                  <Clipboard className="w-5 h-5 text-indigo-400" />
                  <span>抽籤名單編輯</span>
                </label>
                
                <div className="flex gap-2">
                  <button
                    id="btn_shuffle_list"
                    disabled={isSpinning || participants.length === 0}
                    onClick={handleShuffleList}
                    className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                    title="隨機洗牌名單"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>
                  <button
                    id="btn_clear_list"
                    disabled={isSpinning}
                    onClick={handleClearList}
                    className="p-2 text-slate-400 hover:text-rose-400 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                    title="清空名單"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Text fields */}
              <div className="relative">
                <textarea
                  id="textarea_participants"
                  value={inputText}
                  disabled={isSpinning}
                  onFocus={() => setIsTextareaFocused(true)}
                  onBlur={() => {
                    setIsTextareaFocused(false);
                    pushConfigToCloud(inputText, themeSelection, removeAfterDraw);
                  }}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="請輸入抽籤名單項目，可用「逗號」、「頓號」或「換行」區隔..."
                  className="w-full h-36 px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm resize-none disabled:opacity-60 disabled:cursor-not-allowed"
                />
                
                <span className="absolute bottom-3 right-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono text-xs font-bold px-2.5 py-1 rounded-md">
                  人數: {participants.length} 人
                </span>
              </div>

              <div className="flex items-start gap-2 text-xs text-slate-500 mt-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800/40">
                <Info className="w-3.5 h-3.5 mt-0.5 text-indigo-400/80 flex-shrink-0" />
                <p className="leading-relaxed">
                  滑鼠游標在此欄位輸入名冊（如：小明、小王、小華），大轉盤名單與線上所有配接客戶端均會即時同步！
                </p>
              </div>
            </div>

            {/* Presets setup */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h3 className="font-semibold text-slate-200 font-display text-base mb-4 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                <span>快速載入範本</span>
              </h3>
              
              <div className="flex flex-wrap gap-2.5">
                {PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    id={`preset_btn_${idx}`}
                    disabled={isSpinning}
                    onClick={() => handleApplyPreset(preset.text)}
                    className="px-3.5 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 rounded-xl text-xs font-medium text-slate-300 hover:text-white transition-all text-left flex items-center justify-between gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Firestore configs */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <h3 className="font-semibold text-slate-200 font-display text-base pb-2 border-b border-slate-800 flex items-center gap-2">
                <Layout className="w-5 h-5 text-amber-400" />
                <span>轉盤精細化設定</span>
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2.5">
                  炫彩佈景主題 (動態扇形顏色)
                </label>
                <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800/60">
                  {(['vibrant', 'pastel', 'neon', 'sunset', 'cool'] as const).map((themeType) => (
                    <button
                      key={themeType}
                      id={`theme_btn_${themeType}`}
                      disabled={isSpinning}
                      onClick={() => handleToggleTheme(themeType)}
                      className={`py-2 px-1 text-[10px] md:text-xs font-bold rounded-lg transition-all text-center uppercase cursor-pointer ${
                        themeSelection === themeType
                          ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold'
                          : 'text-slate-500 hover:text-slate-300 bg-transparent border border-transparent'
                      }`}
                    >
                      {themeType}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-800/60 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="block text-sm font-semibold text-slate-200">
                    幸運得主自動移出名單
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    抽中該人選後同步自上面輸入名冊中剔除大名
                  </p>
                </div>

                <label className="relative inline-flex items-center checked:bg-slate-500 cursor-pointer select-none">
                  <input
                    id="checkbox_remove_draw"
                    type="checkbox"
                    checked={removeAfterDraw}
                    disabled={isSpinning}
                    onChange={(e) => handleToggleRemoveAfter(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-slate-950 peer-checked:after:border-amber-400" />
                </label>
              </div>
            </div>

          </section>

          {/* Canvas drawings wheel rendering */}
          <section id="section_wheel_display" className="lg:col-span-7 flex flex-col items-center">
            
            <div className="w-full text-center select-none mb-4">
              <h2 className="text-xl font-bold text-slate-300 font-display tracking-wide mb-1">
                幸運之輪，旋轉啟動！
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                按下按鈕召喚今日好運，精美指標在停止後會指出獲勝者！
              </p>

              {/* Top main button */}
              <div className="mb-4">
                <button
                  id="btn_top_master_spin"
                  disabled={isSpinning || participants.length === 0}
                  onClick={handleTriggerSpin}
                  className={`w-full max-w-sm mx-auto flex items-center justify-center gap-3 py-4.5 px-8 rounded-2xl text-xl font-extrabold tracking-widest transition-all duration-300 shadow-xl border-t cursor-pointer select-none ${
                    isSpinning || participants.length === 0
                      ? 'bg-slate-800/80 border-slate-700 text-slate-600 cursor-not-allowed pointer-events-none'
                      : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 border-yellow-300 hover:border-yellow-200 active:scale-97 hover:shadow-yellow-500/20 hover:-translate-y-0.5'
                  }`}
                >
                  <Sparkles className={`w-6 h-6 ${isSpinning ? 'animate-spin' : 'animate-bounce'}`} />
                  <span>開始抽籤！</span>
                </button>
              </div>
            </div>

            <div className="w-full max-w-lg mb-8">
              <WheelCanvas
                participants={participants}
                theme={themeSelection}
                soundEnabled={soundEnabled}
                onSpinStart={() => setIsSpinning(true)}
                onSpinComplete={handleSpinComplete}
                isSpinning={isSpinning}
                setIsSpinning={setIsSpinning}
              />
            </div>

            <div className="w-full max-w-lg">
              <HistoryList
                history={historyList}
                onClearHistory={handleClearHistory}
              />
            </div>

          </section>

        </div>

        {/* Footer */}
        <footer className="mt-16 text-center select-none pt-6 border-t border-slate-900 text-xs text-slate-600 font-mono tracking-wide leading-relaxed">
          <p>
            動態抽籤大轉盤系統 &bull; 開發平台 AI Studio &bull; 全端自適應流暢架構
          </p>
          <p className="mt-1 flex items-center justify-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>所有物理動畫模組與 Firestore 雲端即時連線運作中</span>
          </p>
        </footer>

      </main>

      <WinnerModal
        isOpen={isWinnerModalOpen}
        winner={winner}
        onClose={() => setIsWinnerModalOpen(false)}
        onRemoveWinner={removeParticipant}
        soundEnabled={soundEnabled}
      />
    </div>
  );
}
