
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

interface DrawingCanvasProps {
  tool: 'pen' | 'eraser';
}

export interface DrawingCanvasHandle {
  clear: () => void;
  undo: () => void;
  getDataUrl: () => string;
}

const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(({ tool }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const historyRef = useRef<ImageData[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // 简化为 1:1 映射：画布像素尺寸 = CSS 尺寸，避免上下区域不一致
    canvas.width = rect.width;
    canvas.height = rect.height;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (context) {
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = 'black';
      context.lineWidth = 4;
      contextRef.current = context;
      
      // Initial save
      saveHistory();
    }
  }, []);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      contextRef.current.lineWidth = tool === 'eraser' ? 20 : 4;
    }
  }, [tool]);

  const saveHistory = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    if (canvas && context) {
      historyRef.current.push(context.getImageData(0, 0, canvas.width, canvas.height));
      // Limit history
      if (historyRef.current.length > 30) historyRef.current.shift();
    }
  };

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    const { offsetX, offsetY } = getCoordinates(event);
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = getCoordinates(event);
    contextRef.current?.lineTo(offsetX, offsetY);
    contextRef.current?.stroke();
  };

  const finishDrawing = () => {
    if (isDrawing) {
      contextRef.current?.closePath();
      saveHistory();
    }
    setIsDrawing(false);
  };

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { offsetX: 0, offsetY: 0 };

    let clientX: number;
    let clientY: number;

    if ('touches' in event) {
      // Touch event
      if (event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else if ('changedTouches' in event && event.changedTouches.length > 0) {
        clientX = event.changedTouches[0].clientX;
        clientY = event.changedTouches[0].clientY;
      } else {
        return { offsetX: 0, offsetY: 0 };
      }
    } else {
      // Mouse event
      clientX = event.clientX;
      clientY = event.clientY;
    }

    return {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
    };
  };

  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      if (canvas && context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        saveHistory();
      }
    },
    undo: () => {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      if (canvas && context && historyRef.current.length > 1) {
        historyRef.current.pop(); // remove current state
        const prevState = historyRef.current[historyRef.current.length - 1];
        context.putImageData(prevState, 0, 0);
      }
    },
    getDataUrl: () => {
      // Return a copy with white background for analysis
      const canvas = canvasRef.current;
      if (!canvas) return '';
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCtx.fillStyle = 'white';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.drawImage(canvas, 0, 0);
      }
      return tempCanvas.toDataURL('image/png');
    }
  }));

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={finishDrawing}
      onMouseLeave={finishDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={finishDrawing}
      className="w-full h-full cursor-crosshair"
    />
  );
});

DrawingCanvas.displayName = 'DrawingCanvas';
export default DrawingCanvas;
