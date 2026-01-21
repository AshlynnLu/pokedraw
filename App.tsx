
import React, { useState, useEffect, useRef } from 'react';
import { GameState, Pokemon, DrawingResult } from './types';
import { getRandomPokemon } from './services/pokemonService';
import DrawingCanvas, { DrawingCanvasHandle } from './components/DrawingCanvas';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('HOME');
  const [currentPokemon, setCurrentPokemon] = useState<Pokemon | null>(null);
  const [drawingTool, setDrawingTool] = useState<'pen' | 'eraser'>('pen');
  const [lastResult, setLastResult] = useState<DrawingResult | null>(null);
  
  const canvasRef = useRef<DrawingCanvasHandle>(null);

  // 控制页面滚动：在首页和绘画页禁止滚动，其它页面恢复（包含 iOS Safari）
  useEffect(() => {
    const preventScroll = (e: TouchEvent) => {
      // 仅在 HOME / DRAWING 阶段阻止默认滚动行为
      if (gameState === 'HOME' || gameState === 'DRAWING') {
        e.preventDefault();
      }
    };

    if (gameState === 'HOME' || gameState === 'DRAWING') {
      document.body.style.overflowY = 'hidden';
      window.addEventListener('touchmove', preventScroll, { passive: false });
    } else {
      document.body.style.overflowY = '';
    }

    return () => {
      document.body.style.overflowY = '';
      window.removeEventListener('touchmove', preventScroll);
    };
  }, [gameState]);

  const startGame = async () => {
    const pkmn = await getRandomPokemon();
    setCurrentPokemon(pkmn);
    setGameState('DRAWING');
    setDrawingTool('pen');
  };

  const handleFinish = async () => {
    if (!canvasRef.current || !currentPokemon) return;
    
    const userDrawing = canvasRef.current.getDataUrl();
    
    const placeholderResult: DrawingResult = {
      id: Date.now().toString(),
      pokemon: currentPokemon,
      userDrawing,
      score: 0,
      comment: "",
      timestamp: Date.now()
    };

    setLastResult(placeholderResult);
    setGameState('RESULT');
  };

  // --- Screens ---

  if (gameState === 'HOME') {
    return (
      <div className="relative flex h-dvh w-full max-w-md mx-auto flex-col pokeball-bg overflow-hidden p-6">
        <div className="pokeball-line"></div>
        <div className="pokeball-center">
          <div className="pokeball-inner-circle"></div>
        </div>

        <div className="relative z-30 flex flex-col h-full flex-1 justify-between py-12">
          <div className="flex flex-col items-center pt-10">
            <h1 className="text-white text-4xl font-black tracking-wider text-center drop-shadow-md mt-4">
              盲画宝可梦
            </h1>
          </div>

          <div className="flex flex-col items-center gap-8">
            <button 
              onClick={startGame}
              className="w-full max-w-xs flex items-center justify-center rounded-2xl h-20 bg-poke-black text-white text-2xl font-black tracking-widest shadow-[0_8px_0_rgb(0,0,0,0.2)] hover:translate-y-[-2px] active:translate-y-[2px] active:shadow-none transition-all">
              开始游戏
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'DRAWING') {
    return (
      <div className="bg-white h-dvh w-full max-w-md mx-auto flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 pt-12 pb-6 bg-poke-red text-white z-10 rounded-b-[2rem] shadow-lg">
          <button onClick={() => setGameState('HOME')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase tracking-widest text-white/80 font-medium">请凭记忆画出：</span>
            <h2 className="text-2xl font-black leading-tight tracking-tight">{currentPokemon?.chineseName}</h2>
          </div>
          <div className="w-14 flex items-center justify-center" />
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
              onClick={handleFinish}
              className="pointer-events-auto h-20 w-20 flex flex-col items-center justify-center bg-poke-red text-white rounded-2xl shadow-lg shadow-red-200 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
              <span className="material-symbols-outlined text-3xl">check_circle</span>
              <span className="font-bold text-sm tracking-widest mt-1">完成</span>
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
          <div className="relative flex flex-col gap-4">
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

            {/* User Drawing */}
            <div className="overflow-hidden rounded-2xl bg-white shadow-xl border-4 border-white">
              <div className="relative aspect-[4/3] w-full bg-center bg-no-repeat bg-contain bg-gray-50 flex items-center justify-center">
                <img src={lastResult.userDrawing} alt="User" className="max-h-full object-contain" />
                <div className="absolute top-3 left-3 bg-poke-black text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">你的作品</div>
              </div>
              <div className="p-3 bg-white">
                <h3 className="text-poke-black font-bold text-lg">你的作品</h3>
              </div>
            </div>
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
