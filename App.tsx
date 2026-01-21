
import React, { useState, useEffect, useRef } from 'react';
import { GameState, GameMode, Pokemon, DrawingResult } from './types';
import { getRandomPokemon } from './services/pokemonService';
import { getAIScore } from './services/geminiService';
import DrawingCanvas, { DrawingCanvasHandle } from './components/DrawingCanvas';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('HOME');
  const [gameMode, setGameMode] = useState<GameMode>('NORMAL');
  const [currentPokemon, setCurrentPokemon] = useState<Pokemon | null>(null);
  const [drawingTool, setDrawingTool] = useState<'pen' | 'eraser'>('pen');
  const [timer, setTimer] = useState(0);
  const [isScoring, setIsScoring] = useState(false);
  const [lastResult, setLastResult] = useState<DrawingResult | null>(null);
  
  const canvasRef = useRef<DrawingCanvasHandle>(null);

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (gameState === 'DRAWING' && gameMode === 'TIMED' && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            handleFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, gameMode, timer]);

  const startGame = async () => {
    const pkmn = await getRandomPokemon();
    setCurrentPokemon(pkmn);
    setGameState('DRAWING');
    setDrawingTool('pen');
    if (gameMode === 'TIMED') {
      setTimer(60);
    }
  };

  const handleFinish = async () => {
    if (!canvasRef.current || !currentPokemon) return;
    
    setIsScoring(true);
    const userDrawing = canvasRef.current.getDataUrl();
    
    try {
      const aiResult = await getAIScore(currentPokemon.chineseName, currentPokemon.imageUrl, userDrawing);
      
      const result: DrawingResult = {
        id: Date.now().toString(),
        pokemon: currentPokemon,
        userDrawing,
        score: aiResult.score,
        comment: aiResult.comment,
        timestamp: Date.now()
      };
      
      setLastResult(result);
      setGameState('RESULT');
    } catch (error) {
      console.error("Scoring failed:", error);
      alert("AI 评分系统似乎遇到了点麻烦，请重试！");
    } finally {
      setIsScoring(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- Screens ---

  if (gameState === 'HOME') {
    return (
      <div className="relative flex min-h-screen w-full max-w-md mx-auto flex-col pokeball-bg overflow-hidden p-6">
        <div className="pokeball-line"></div>
        <div className="pokeball-center">
          <div className="pokeball-inner-circle"></div>
        </div>
        
        <div className="relative z-30 flex items-center justify-end">
          <div className="flex size-12 items-center justify-center bg-black/20 rounded-full backdrop-blur-md cursor-pointer">
            <span className="material-symbols-outlined text-white">emoji_events</span>
          </div>
        </div>

        <div className="relative z-30 flex flex-col h-full flex-1 justify-between py-12">
          <div className="flex flex-col items-center pt-4">
            <div className="relative mb-6">
              <div className="bg-white/30 absolute -inset-4 rounded-full blur-2xl"></div>
              <div className="bg-white aspect-square rounded-full w-24 h-24 shadow-xl relative z-10 flex items-center justify-center border-4 border-poke-black">
                <span className="material-symbols-outlined text-4xl text-poke-red" style={{ fontVariationSettings: "'FILL' 1" }}>draw</span>
              </div>
            </div>
            <h1 className="text-white text-4xl font-black tracking-wider text-center drop-shadow-md">盲画宝可梦</h1>
            <p className="text-white/90 text-sm font-medium mt-2 tracking-widest bg-black/10 px-4 py-1 rounded-full uppercase">AI 相似度评分系统</p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="w-full max-w-xs bg-white/50 p-2 rounded-2xl flex gap-2 border border-gray-100">
              <button 
                onClick={() => setGameMode('NORMAL')}
                className={`flex-1 flex h-12 items-center justify-center gap-x-2 rounded-xl transition-all active:scale-95 ${gameMode === 'NORMAL' ? 'bg-poke-red text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>
                <span className="material-symbols-outlined text-xl">palette</span>
                <span className="font-bold text-sm">普通模式</span>
              </button>
              <button 
                onClick={() => setGameMode('TIMED')}
                className={`flex-1 flex h-12 items-center justify-center gap-x-2 rounded-xl transition-all active:scale-95 ${gameMode === 'TIMED' ? 'bg-poke-red text-white shadow-md' : 'bg-gray-100 text-gray-600'}`}>
                <span className="material-symbols-outlined text-xl">timer</span>
                <span className="font-bold text-sm">计时模式</span>
              </button>
            </div>
            
            <button 
              onClick={startGame}
              className="w-full max-w-xs flex items-center justify-center rounded-2xl h-20 bg-poke-black text-white text-2xl font-black tracking-widest shadow-[0_8px_0_rgb(0,0,0,0.2)] hover:translate-y-[-2px] active:translate-y-[2px] active:shadow-none transition-all">
              开始游戏
            </button>

            <div className="w-full max-w-sm glass-card rounded-3xl p-5 shadow-sm border border-gray-200">
              <p className="text-poke-black text-sm font-bold mb-4 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-poke-red">info</span>
                玩法说明
              </p>
              <div className="flex justify-between items-center px-2">
                <Step icon="lightbulb" label="思考" />
                <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                <Step icon="edit" label="绘制" />
                <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                <Step icon="analytics" label="评分" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'DRAWING') {
    return (
      <div className="bg-white min-h-screen w-full max-w-md mx-auto flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 pt-12 pb-6 bg-poke-red text-white z-10 rounded-b-[2rem] shadow-lg">
          <button onClick={() => setGameState('HOME')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase tracking-widest text-white/80 font-medium">请凭记忆画出：</span>
            <h2 className="text-2xl font-black leading-tight tracking-tight">{currentPokemon?.chineseName}</h2>
          </div>
          <div className="w-14 flex items-center justify-center">
            {gameMode === 'TIMED' && (
              <span className="text-sm font-bold bg-black/20 px-2 py-1 rounded-lg">{formatTime(timer)}</span>
            )}
          </div>
        </header>

        <main className="flex-1 relative flex flex-col px-4 pt-6 pb-28">
          <div className="flex-1 bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border-4 border-gray-100 relative overflow-hidden canvas-container">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "radial-gradient(#000 1px, transparent 1px)", backgroundSize: "32px 32px" }}></div>
            <DrawingCanvas ref={canvasRef} tool={drawingTool} />
          </div>
        </main>

        <div className="fixed bottom-0 left-0 right-0 p-6 pb-10 pointer-events-none z-20">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <div className="flex-1 flex items-center justify-around p-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 pointer-events-auto">
              <ToolButton active={drawingTool === 'pen'} icon="edit" label="画笔" onClick={() => setDrawingTool('pen')} />
              <ToolButton active={drawingTool === 'eraser'} icon="ink_eraser" label="橡皮" onClick={() => setDrawingTool('eraser')} />
              <div className="w-px h-8 bg-gray-200 mx-1"></div>
              <ToolButton active={false} icon="undo" label="撤销" onClick={() => canvasRef.current?.undo()} />
              <ToolButton active={false} icon="delete" label="清空" onClick={() => canvasRef.current?.clear()} danger />
            </div>
            <button 
              disabled={isScoring}
              onClick={handleFinish}
              className="pointer-events-auto h-20 w-20 flex flex-col items-center justify-center bg-poke-red text-white rounded-2xl shadow-lg shadow-red-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
              <span className="material-symbols-outlined text-3xl">{isScoring ? 'sync' : 'check_circle'}</span>
              <span className="font-bold text-sm tracking-widest mt-1">{isScoring ? '评分中' : '完成'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'RESULT' && lastResult) {
    return (
      <div className="bg-white min-h-screen w-full max-w-md mx-auto flex flex-col items-center">
        <div className="w-full bg-poke-red text-white pt-12 pb-24 relative">
          <div className="flex items-center px-4 justify-between">
            <button onClick={() => setGameState('HOME')} className="size-10 flex items-center justify-center rounded-full bg-white/20">
              <span className="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <h2 className="text-xl font-black tracking-tight flex-1 text-center">对比结果</h2>
            <div className="size-10"></div>
          </div>
        </div>
        
        <main className="w-full flex-1 px-4 -mt-16 z-10 space-y-4 pb-12">
          <div className="relative flex flex-col gap-2">
            {/* Official Art */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-xl border-4 border-white">
              <div className="relative aspect-[4/3] w-full bg-center bg-no-repeat bg-contain bg-gray-50 flex items-center justify-center">
                <img src={lastResult.pokemon.imageUrl} alt="Official" className="max-h-full object-contain p-2" />
                <div className="absolute top-3 left-3 bg-poke-red text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">官方图</div>
              </div>
              <div className="p-3 bg-white">
                <h3 className="text-poke-black font-bold text-lg">{lastResult.pokemon.chineseName}</h3>
              </div>
            </div>

            {/* AI Badge */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="w-24 h-24 rounded-full bg-white shadow-[0_0_20px_rgba(0,0,0,0.15),0_0_0_8px_rgba(255,255,255,1)] border-[6px] border-poke-black flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-gray-500 leading-none">相似度</span>
                <span className="text-2xl font-black text-poke-black leading-tight">{lastResult.score}%</span>
                <div className="w-6 h-1 bg-poke-red rounded-full mt-1"></div>
              </div>
            </div>

            {/* User Drawing */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-xl border-4 border-white">
              <div className="relative aspect-[4/3] w-full bg-center bg-no-repeat bg-contain bg-gray-50 flex items-center justify-center">
                <img src={lastResult.userDrawing} alt="User" className="max-h-full object-contain" />
                <div className="absolute top-3 left-3 bg-poke-black text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">你的作品</div>
              </div>
              <div className="p-3 bg-white">
                <h3 className="text-poke-black font-bold text-lg">灵魂画手作品</h3>
              </div>
            </div>
          </div>

          <div className="py-6 px-4 text-center">
            <p className="text-gray-500 font-medium italic">"{lastResult.comment}"</p>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={startGame}
              className="w-full bg-poke-red hover:bg-red-600 text-white font-black text-lg py-5 rounded-2xl shadow-lg shadow-red-200 flex items-center justify-center gap-2 transition-transform active:scale-95">
              <span className="material-symbols-outlined font-bold">refresh</span> 再来一次
            </button>
            <div className="flex gap-3">
              <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-poke-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">download</span> 保存
              </button>
              <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-poke-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">share</span> 分享
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return null;
};

// --- Helper Components ---

const Step: React.FC<{ icon: string; label: string }> = ({ icon, label }) => (
  <div className="flex flex-col items-center text-center">
    <div className="size-10 bg-red-50 rounded-full flex items-center justify-center mb-1">
      <span className="material-symbols-outlined text-poke-red text-lg">{icon}</span>
    </div>
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
  </div>
);

const ToolButton: React.FC<{ active: boolean; icon: string; label: string; onClick: () => void; danger?: boolean }> = ({ active, icon, label, onClick, danger }) => (
  <div className="flex flex-col items-center gap-1">
    <button 
      onClick={onClick}
      className={`p-3 rounded-xl flex items-center justify-center transition-all ${active ? 'bg-red-50 text-poke-red' : danger ? 'text-gray-400 hover:bg-red-50 hover:text-red-500' : 'text-gray-400 hover:bg-gray-100'}`}>
      <span className="material-symbols-outlined" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
    </button>
    <span className={`text-[10px] font-bold ${active ? 'text-poke-red' : 'text-gray-400'}`}>{label}</span>
  </div>
);

export default App;
