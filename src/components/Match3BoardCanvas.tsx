import React, { useEffect, useRef } from 'react';
import { BoardStateMachine } from '../engine/BoardStateMachine';
import { GridCoord } from '../engine/Matcher';

interface Match3BoardCanvasProps {
  engine: BoardStateMachine;
}

const SWIPE_THRESHOLD_PX = 18;

export const Match3BoardCanvas: React.FC<Match3BoardCanvasProps> = ({ engine }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerStateRef = useRef<{
    active: boolean;
    pointerId: number;
    startX: number;
    startY: number;
    startCell: GridCoord | null;
    swiped: boolean;
  }>({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    startCell: null,
    swiped: false,
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let cssW = container.clientWidth;
    let cssH = container.clientHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const syncSize = () => {
      cssW = Math.max(240, container.clientWidth);
      cssH = Math.max(240, container.clientHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    syncSize();
    const ro = new ResizeObserver(syncSize);
    ro.observe(container);

    let rafId = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = now - lastTime;
      lastTime = now;
      engine.update(dt);
      engine.render(ctx, cssW, cssH, now);
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [engine]);

  const getLocalPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = getLocalPoint(e);
    const cell = engine.pixelToCell(x, y);
    pointerStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: x,
      startY: y,
      startCell: cell,
      swiped: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const st = pointerStateRef.current;
    if (!st.active || st.pointerId !== e.pointerId || st.swiped || !st.startCell) return;

    const { x, y } = getLocalPoint(e);
    const dx = x - st.startX;
    const dy = y - st.startY;
    if (Math.hypot(dx, dy) < SWIPE_THRESHOLD_PX) return;

    st.swiped = true;
    if (Math.abs(dx) >= Math.abs(dy)) {
      engine.handleSwipe(st.startCell, 0, dx > 0 ? 1 : -1);
    } else {
      engine.handleSwipe(st.startCell, dy > 0 ? 1 : -1, 0);
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const st = pointerStateRef.current;
    if (!st.active || st.pointerId !== e.pointerId) return;
    if (!st.swiped && st.startCell) {
      engine.handleTap(st.startCell);
    }
    st.active = false;
    st.startCell = null;
  };

  const onPointerCancel = () => {
    pointerStateRef.current.active = false;
    pointerStateRef.current.startCell = null;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center touch-none select-none"
    >
      <canvas
        ref={canvasRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className="block touch-none cursor-pointer"
      />
    </div>
  );
};
