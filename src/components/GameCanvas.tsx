'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore, triggerBot, triggerBotAction } from '../store/gameStore';
import BotActionPanel from './BotActionPanel';
import { CanvasManager } from '../renderer/CanvasManager';
import { BoardRenderer } from '../renderer/BoardRenderer';
import { PieceRenderer } from '../renderer/PieceRenderer';
import { HighlightRenderer } from '../renderer/HighlightRenderer';
import { InputHandler } from '../renderer/InputHandler';
import { AnimationSystem } from '../renderer/AnimationSystem';
import type { PieceSnapshot } from '../renderer/AnimationSystem';
import { MoveAnimation } from '../renderer/animations/MoveAnimation';
import { DestroyAnimation } from '../renderer/animations/DestroyAnimation';
import { SwapAnimation } from '../renderer/animations/SwapAnimation';
import { MoveAndDestroyAnimation } from '../renderer/animations/MoveAndDestroyAnimation';
import { ParticleSystem } from '../renderer/ParticleSystem';
import { EventType } from '../engine/events/Event';
import type { DestroyEvent as DestroyEvt } from '../engine/events/events/DestroyEvent';
import { Pos } from '../engine/core/Pos';
import { EPlayer } from '../engine/core/EPlayer';
import { BotActionType } from '../engine/botactions/BotActionType';

interface HoverArrowData {
  posKey: string;
  defenders: { fx: number; fy: number; tx: number; ty: number }[];
  attackers: { fx: number; fy: number; tx: number; ty: number }[];
  targets:   { fx: number; fy: number; tx: number; ty: number }[];
}

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const managerRef = useRef<CanvasManager | null>(null);
  const inputRef = useRef<InputHandler | null>(null);
  const animSystemRef = useRef<AnimationSystem>(new AnimationSystem());
  const boardRendererRef = useRef(new BoardRenderer());
  const pieceRendererRef = useRef(new PieceRenderer());
  const highlightRendererRef = useRef(new HighlightRenderer());
  const hoverPosRef = useRef<Pos | null>(null);
  const particleSystemRef = useRef(new ParticleSystem());
  const sepiaAlphaRef = useRef(0);

  // Zoom/Pan state (refs for render-loop performance)
  const zoomRef = useRef(1);
  const panXRef = useRef(0);
  const panYRef = useRef(0);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const panStartPanRef = useRef({ x: 0, y: 0 });
  // Track previous game identity to reset zoom/pan on new game
  const prevGameIdRef = useRef<number | null>(null);

  // Hover arrow cache
  const hoverArrowCacheRef = useRef<HoverArrowData | null>(null);
  const lastTurnRef = useRef<number>(-1);

  const game = useGameStore((s) => s.game);
  const botActionsEnabled = useGameStore((s) => s.config.botActions);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cm = new CanvasManager(canvas);
    managerRef.current = cm;

    const ih = new InputHandler(canvas);
    inputRef.current = ih;

    ih.setClickHandler((pos: Pos) => {
      if (isPanningRef.current) return;
      const state = useGameStore.getState();
      if (!state.game) return;
      if (animSystemRef.current.isAnimating) return;
      const w = state.game.state.width;
      const h = state.game.state.height;
      if (pos.x < 0 || pos.y < 0 || pos.x >= w || pos.y >= h) return;
      state.clickCell(pos);
    });

    ih.setHoverHandler((pos: Pos | null) => {
      hoverPosRef.current = pos;
    });

    cm.onRender((dt) => {
      renderFrame(cm, dt);
    });

    cm.start();

    // Wheel zoom
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const state = useGameStore.getState();
      if (!state.game) return;

      const { width, height } = state.game.state;
      const dw = cm.displayWidth;
      const dh = cm.displayHeight;
      const baseCellSize = Math.min(dw / width, dh / height);
      const oldZoom = zoomRef.current;
      const oldCellSize = baseCellSize * oldZoom;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      let newZoom = oldZoom * zoomFactor;

      // Clamp zoom
      const minZoom = Math.max(4 / baseCellSize, 0.1);
      const maxZoom = 80 / baseCellSize;
      newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));

      const newCellSize = baseCellSize * newZoom;

      // Zoom centered on cursor
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const oldOffsetX = (dw - oldCellSize * width) / 2 + panXRef.current;
      const oldOffsetY = (dh - oldCellSize * height) / 2 + panYRef.current;

      // World position under cursor before zoom
      const wx = (mx - oldOffsetX) / oldCellSize;
      const wy = (my - oldOffsetY) / oldCellSize;

      // New offset to keep world position under cursor
      const newBaseOffsetX = (dw - newCellSize * width) / 2;
      const newBaseOffsetY = (dh - newCellSize * height) / 2;
      panXRef.current = mx - wx * newCellSize - newBaseOffsetX;
      panYRef.current = my - wy * newCellSize - newBaseOffsetY;
      zoomRef.current = newZoom;
    };
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // Right-click pan
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2) {
        isPanningRef.current = true;
        panStartRef.current = { x: e.clientX, y: e.clientY };
        panStartPanRef.current = { x: panXRef.current, y: panYRef.current };
      }
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (isPanningRef.current) {
        panXRef.current = panStartPanRef.current.x + (e.clientX - panStartRef.current.x);
        panYRef.current = panStartPanRef.current.y + (e.clientY - panStartRef.current.y);
      }
    };
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 2) {
        isPanningRef.current = false;
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    const handleResize = () => {
      cm.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      ih.destroy();
      cm.destroy();
    };
  }, []);

  // Reset zoom/pan when game changes
  useEffect(() => {
    if (game) {
      // Use a simple identity: board dimensions + turn count at start
      const id = game.state.width * 10000 + game.state.height;
      if (prevGameIdRef.current !== null && prevGameIdRef.current !== id) {
        zoomRef.current = 1;
        panXRef.current = 0;
        panYRef.current = 0;
      }
      prevGameIdRef.current = id;
    }
  }, [game]);

  const fitView = useCallback(() => {
    zoomRef.current = 1;
    panXRef.current = 0;
    panYRef.current = 0;
  }, []);

  const zoomIn = useCallback(() => {
    const state = useGameStore.getState();
    if (!state.game || !managerRef.current) return;
    const { width, height } = state.game.state;
    const dw = managerRef.current.displayWidth;
    const dh = managerRef.current.displayHeight;
    const baseCellSize = Math.min(dw / width, dh / height);
    const maxZoom = 80 / baseCellSize;

    // Zoom toward center of viewport
    const oldZoom = zoomRef.current;
    const newZoom = Math.min(oldZoom * 1.3, maxZoom);
    const oldCellSize = baseCellSize * oldZoom;
    const newCellSize = baseCellSize * newZoom;
    const cx = dw / 2;
    const cy = dh / 2;
    const oldOffsetX = (dw - oldCellSize * width) / 2 + panXRef.current;
    const oldOffsetY = (dh - oldCellSize * height) / 2 + panYRef.current;
    const wx = (cx - oldOffsetX) / oldCellSize;
    const wy = (cy - oldOffsetY) / oldCellSize;
    const newBaseOffsetX = (dw - newCellSize * width) / 2;
    const newBaseOffsetY = (dh - newCellSize * height) / 2;
    panXRef.current = cx - wx * newCellSize - newBaseOffsetX;
    panYRef.current = cy - wy * newCellSize - newBaseOffsetY;
    zoomRef.current = newZoom;
  }, []);

  const zoomOut = useCallback(() => {
    const state = useGameStore.getState();
    if (!state.game || !managerRef.current) return;
    const { width, height } = state.game.state;
    const dw = managerRef.current.displayWidth;
    const dh = managerRef.current.displayHeight;
    const baseCellSize = Math.min(dw / width, dh / height);
    const minZoom = Math.max(4 / baseCellSize, 0.1);

    const oldZoom = zoomRef.current;
    const newZoom = Math.max(oldZoom / 1.3, minZoom);
    const oldCellSize = baseCellSize * oldZoom;
    const newCellSize = baseCellSize * newZoom;
    const cx = dw / 2;
    const cy = dh / 2;
    const oldOffsetX = (dw - oldCellSize * width) / 2 + panXRef.current;
    const oldOffsetY = (dh - oldCellSize * height) / 2 + panYRef.current;
    const wx = (cx - oldOffsetX) / oldCellSize;
    const wy = (cy - oldOffsetY) / oldCellSize;
    const newBaseOffsetX = (dw - newCellSize * width) / 2;
    const newBaseOffsetY = (dh - newCellSize * height) / 2;
    panXRef.current = cx - wx * newCellSize - newBaseOffsetX;
    panYRef.current = cy - wy * newCellSize - newBaseOffsetY;
    zoomRef.current = newZoom;
  }, []);

  const renderFrame = useCallback((cm: CanvasManager, dt: number) => {
    const state = useGameStore.getState();
    const g = state.game;
    if (!g) return;

    const ctx = cm.ctx;
    const { width, height } = g.state;
    const dw = cm.displayWidth;
    const dh = cm.displayHeight;
    const baseCellSize = Math.min(dw / width, dh / height);
    const cellSize = baseCellSize * zoomRef.current;
    const offsetX = (dw - cellSize * width) / 2 + panXRef.current;
    const offsetY = (dh - cellSize * height) / 2 + panYRef.current;

    // Update input handler grid every frame (zoom/pan may have changed)
    inputRef.current?.setGrid(offsetX, offsetY, cellSize);

    // Visible cell range for viewport culling
    const startCol = Math.max(0, Math.floor(-offsetX / cellSize));
    const endCol = Math.min(width, Math.ceil((dw - offsetX) / cellSize));
    const startRow = Math.max(0, Math.floor(-offsetY / cellSize));
    const endRow = Math.min(height, Math.ceil((dh - offsetY) / cellSize));

    // Check for pending draw event and start animation
    const animSystem = animSystemRef.current;
    const particles = particleSystemRef.current;
    if (state.pendingDrawEvent && !animSystem.isAnimating) {
      const useParallel = state.pendingParallelDraw;

      // Spawn particles for immediate DESTROY events
      for (const event of state.pendingDrawEvent.getEvents()) {
        if (event.type === EventType.DESTROY) {
          const e = event as DestroyEvt;
          const px = offsetX + e.pos.x * cellSize + cellSize / 2;
          const py = offsetY + e.pos.y * cellSize + cellSize / 2;
          particles.spawn(px, py, e.piece.pieceType.pieceTypeId.seed, e.piece.lvl, cellSize);
        }
      }

      animSystem.startFromDrawEvent(
        state.pendingDrawEvent,
        g.state,
        cellSize,
        offsetX,
        offsetY,
        () => {
          const currentState = useGameStore.getState();
          const currentGame = currentState.game;
          if (!currentGame || currentGame.getWinner() || currentState.botThinking) return;

          if (currentState.config.botActions) {
            // Bot actions mode: trigger bot action for P2
            if (currentState.config.mode === 'bot' &&
                currentGame.getPlayersTurn() === EPlayer.P2) {
              triggerBotAction();
            }
          } else {
            // Normal mode: trigger regular bot
            if (currentState.config.mode === 'bot' &&
                currentGame.getPlayersTurn() === EPlayer.P2) {
              triggerBot();
            }
          }
        },
        useParallel,
      );
      useGameStore.setState({ pendingDrawEvent: null, pendingParallelDraw: false });
    }

    // Draw board (with viewport culling support)
    boardRendererRef.current.draw(ctx, width, height, cellSize, offsetX, offsetY, dw, dh);

    const currentPlayer = g.getPlayersTurn();
    const hoveredAction = state.hoveredAction;

    // --- Normal selected-piece sepia (only when no action hovered) ---
    if (!hoveredAction) {
      // --- Normal selected-piece sepia ---
      const sepiaTarget = (!animSystem.isAnimating && state.selectedPiece) ? 0.45 : 0;
      const sa = sepiaAlphaRef.current;
      sepiaAlphaRef.current = sa + (sepiaTarget - sa) * Math.min(1, 8 * dt);

      if (sepiaAlphaRef.current > 0.01) {
        const focusedCells = new Set<number>();
        if (state.selectedPiece) {
          focusedCells.add(state.selectedPiece.pos.y * width + state.selectedPiece.pos.x);
          for (const move of state.possibleMoves) {
            focusedCells.add(move.y * width + move.x);
          }
        }

        ctx.fillStyle = `rgba(50, 35, 15, ${sepiaAlphaRef.current})`;
        for (let cy = startRow; cy < endRow; cy++) {
          for (let cx = startCol; cx < endCol; cx++) {
            if (focusedCells.has(cy * width + cx)) continue;
            ctx.fillRect(offsetX + cx * cellSize, offsetY + cy * cellSize, cellSize, cellSize);
          }
        }
      }
    }

    if (!animSystem.isAnimating && !hoveredAction) {
      // Selected piece moves (subtle pulse)
      if (state.selectedPiece) {
        const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 1000 * Math.PI);
        const blinkAlpha = 0.15 + 0.15 * pulse;
        const isOwn = state.selectedPiece.owner === currentPlayer;

        highlightRendererRef.current.drawSelected(
          ctx, state.selectedPiece.pos, cellSize, offsetX, offsetY,
        );
        highlightRendererRef.current.drawPossibleMoves(
          ctx, state.possibleMoves, cellSize, offsetX, offsetY,
          isOwn, blinkAlpha,
        );
      }

      // Hovered piece moves (steady, shown simultaneously)
      const hoveredPiece = (() => {
        const hp = hoverPosRef.current;
        if (!hp) return null;
        if (hp.x < 0 || hp.y < 0 || hp.x >= width || hp.y >= height) return null;
        return g.state.pieceAt(hp);
      })();

      if (hoveredPiece && hoveredPiece !== state.selectedPiece) {
        const isOwn = hoveredPiece.owner === currentPlayer;
        const hoverMoves = [...hoveredPiece.moveSet.getPossibleMoves()];

        highlightRendererRef.current.drawSelected(
          ctx, hoveredPiece.pos, cellSize, offsetX, offsetY,
        );
        highlightRendererRef.current.drawPossibleMoves(
          ctx, hoverMoves, cellSize, offsetX, offsetY,
          isOwn, 0.25,
        );
      }
    }

    // Update animation system
    animSystem.update(dt);

    // Collect animated piece IDs for custom rendering
    const animatedPieces = new Set<number>();
    for (const anim of animSystem.getActiveAnimations()) {
      if (anim instanceof MoveAnimation) {
        animatedPieces.add(anim.piece.id);
      } else if (anim instanceof DestroyAnimation) {
        animatedPieces.add(anim.piece.id);
      } else if (anim instanceof MoveAndDestroyAnimation) {
        animatedPieces.add(anim.piece.id);
        animatedPieces.add(anim.targetPiece.id);
      } else if (anim instanceof SwapAnimation) {
        animatedPieces.add(anim.piece1.id);
        animatedPieces.add(anim.piece2.id);
      }
    }

    // Draw pieces (skip animated ones) — viewport culling
    const allPieces = g.state.getAllPieces();
    for (const piece of allPieces) {
      if (animatedPieces.has(piece.id)) continue;
      const px = offsetX + piece.pos.x * cellSize;
      const py = offsetY + piece.pos.y * cellSize;
      // Skip pieces outside viewport
      if (px + cellSize < 0 || px > dw || py + cellSize < 0 || py > dh) continue;
      pieceRendererRef.current.draw(
        ctx, px, py, cellSize,
        piece.pieceType.pieceTypeId.seed,
        piece.lvl,
        piece.owner,
        piece.king,
        piece.symbol,
      );
    }

    // Draw animated pieces using snapshot data
    for (const anim of animSystem.getActiveAnimations()) {
      if (anim instanceof MoveAnimation) {
        drawPieceFromSnapshot(ctx, anim.piece, anim.currentX, anim.currentY, cellSize);
      } else if (anim instanceof DestroyAnimation) {
        drawPieceFromSnapshot(ctx, anim.piece, anim.x, anim.y, cellSize, anim.alpha, anim.scale);
      } else if (anim instanceof MoveAndDestroyAnimation) {
        drawPieceFromSnapshot(ctx, anim.piece, anim.currentX, anim.currentY, cellSize);
        if (anim.targetAlpha > 0.01) {
          drawPieceFromSnapshot(ctx, anim.targetPiece, anim.targetX, anim.targetY, cellSize, anim.targetAlpha, anim.targetScale);
        }
        // Delayed particle spawn when shatter begins
        if (anim.shatterStarted && !anim.particlesSpawned) {
          anim.particlesSpawned = true;
          const snap = anim.targetPiece;
          particles.spawn(
            anim.targetX + cellSize / 2,
            anim.targetY + cellSize / 2,
            snap.seed, snap.lvl, cellSize,
          );
        }
      } else if (anim instanceof SwapAnimation) {
        drawPieceFromSnapshot(ctx, anim.piece1, anim.current1X, anim.current1Y, cellSize);
        drawPieceFromSnapshot(ctx, anim.piece2, anim.current2X, anim.current2Y, cellSize);
      }
    }

    // --- Hover arrows (defenders/attackers/targets) ---
    if (!hoveredAction && !animSystem.isAnimating) {
      const hp = hoverPosRef.current;
      const currentTurns = g.getTurns();

      // Invalidate cache on turn change
      if (lastTurnRef.current !== currentTurns) {
        hoverArrowCacheRef.current = null;
        lastTurnRef.current = currentTurns;
      }

      const posKey = hp ? `${hp.x},${hp.y}` : '';
      const cached = hoverArrowCacheRef.current;

      if (hp && hp.x >= 0 && hp.y >= 0 && hp.x < width && hp.y < height) {
        const hoveredPiece = g.state.pieceAt(hp);

        if (hoveredPiece) {
          let arrowData: HoverArrowData;

          if (cached && cached.posKey === posKey) {
            arrowData = cached;
          } else {
            // Compute hover arrows
            const defenders: HoverArrowData['defenders'] = [];
            const attackers: HoverArrowData['attackers'] = [];
            const targets: HoverArrowData['targets'] = [];

            const allPieces = g.state.getAllPieces();
            for (const piece of allPieces) {
              if (piece === hoveredPiece) continue;
              const moves = piece.moveSet.getPossibleMoves();
              const canReach = moves.some(m => m.x === hp.x && m.y === hp.y);
              if (canReach) {
                if (piece.owner === hoveredPiece.owner) {
                  defenders.push({ fx: piece.pos.x, fy: piece.pos.y, tx: hp.x, ty: hp.y });
                } else {
                  attackers.push({ fx: piece.pos.x, fy: piece.pos.y, tx: hp.x, ty: hp.y });
                }
              }
            }

            // Targets: squares the hovered piece can move to that have enemy pieces
            const hoveredMoves = hoveredPiece.moveSet.getPossibleMoves();
            for (const m of hoveredMoves) {
              const target = g.state.pieceAt(m);
              if (target && target.owner !== hoveredPiece.owner) {
                targets.push({ fx: hp.x, fy: hp.y, tx: m.x, ty: m.y });
              }
            }

            arrowData = { posKey, defenders, attackers, targets };
            hoverArrowCacheRef.current = arrowData;
          }

          // Draw arrows
          const lineW = Math.max(1.5, cellSize * 0.045);
          const arrowSize = cellSize * 0.2;

          const drawArrowBatch = (
            arrows: { fx: number; fy: number; tx: number; ty: number }[],
            color: string,
          ) => {
            if (arrows.length === 0) return;
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = lineW;
            ctx.lineCap = 'round';

            ctx.beginPath();
            for (const a of arrows) {
              const x1 = offsetX + (a.fx + 0.5) * cellSize;
              const y1 = offsetY + (a.fy + 0.5) * cellSize;
              const x2 = offsetX + (a.tx + 0.5) * cellSize;
              const y2 = offsetY + (a.ty + 0.5) * cellSize;
              ctx.moveTo(x1, y1);
              ctx.lineTo(x2, y2);
            }
            ctx.stroke();

            for (const a of arrows) {
              const x1 = offsetX + (a.fx + 0.5) * cellSize;
              const y1 = offsetY + (a.fy + 0.5) * cellSize;
              const x2 = offsetX + (a.tx + 0.5) * cellSize;
              const y2 = offsetY + (a.ty + 0.5) * cellSize;
              const angle = Math.atan2(y2 - y1, x2 - x1);
              ctx.beginPath();
              ctx.moveTo(x2, y2);
              ctx.lineTo(
                x2 - arrowSize * Math.cos(angle - 0.4),
                y2 - arrowSize * Math.sin(angle - 0.4),
              );
              ctx.lineTo(
                x2 - arrowSize * Math.cos(angle + 0.4),
                y2 - arrowSize * Math.sin(angle + 0.4),
              );
              ctx.closePath();
              ctx.fill();
            }
          };

          // Team colors: P1 = blue/green, P2 = red
          const ownColor = hoveredPiece.owner === EPlayer.P1
            ? 'rgba(50, 220, 80, 0.50)' : 'rgba(220, 60, 60, 0.50)';
          const enemyColor = hoveredPiece.owner === EPlayer.P1
            ? 'rgba(220, 60, 60, 0.50)' : 'rgba(50, 220, 80, 0.50)';

          drawArrowBatch(arrowData.defenders, ownColor);
          drawArrowBatch(arrowData.attackers, enemyColor);
          drawArrowBatch(arrowData.targets, ownColor);
        } else {
          hoverArrowCacheRef.current = null;
        }
      } else {
        hoverArrowCacheRef.current = null;
      }
    }

    // --- Action hover overlay (drawn AFTER pieces so sepia dims both board+pieces) ---
    if (hoveredAction && hoveredAction.moves.length > 0 && !animSystem.isAnimating) {
      const fromCells = new Set<number>();
      const toCells = new Set<number>();
      for (const move of hoveredAction.moves) {
        fromCells.add(move.fromY * width + move.fromX);
        toCells.add(move.toY * width + move.toX);
      }

      // Enemy cells (e.g. threatening enemies for Evade)
      const enemyCellSet = new Set<number>();
      if (hoveredAction.enemyCells) {
        for (const ec of hoveredAction.enemyCells) {
          enemyCellSet.add(ec.y * width + ec.x);
        }
      }

      // Protected cells (e.g. covered frontline pieces for Cover)
      const protectedCellSet = new Set<number>();
      if (hoveredAction.protectedCells) {
        for (const pc of hoveredAction.protectedCells) {
          protectedCellSet.add(pc.y * width + pc.x);
        }
      }

      // Sepia on all cells not involved in the action
      ctx.fillStyle = 'rgba(50, 35, 15, 0.55)';
      for (let r = startRow; r < endRow; r++) {
        for (let c = startCol; c < endCol; c++) {
          const key = r * width + c;
          if (fromCells.has(key) || toCells.has(key) || enemyCellSet.has(key) || protectedCellSet.has(key)) continue;
          ctx.fillRect(offsetX + c * cellSize, offsetY + r * cellSize, cellSize, cellSize);
        }
      }

      // Semi-transparent base to normalize light/dark squares without hiding pieces
      // Helper: paint a uniform-base highlight on a cell
      const highlightCell = (cx: number, cy: number, r: number, g: number, b: number, a: number) => {
        const px = offsetX + cx * cellSize;
        const py = offsetY + cy * cellSize;
        ctx.fillStyle = 'rgba(208, 174, 139, 0.45)';
        ctx.fillRect(px, py, cellSize, cellSize);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
        ctx.fillRect(px, py, cellSize, cellSize);
      };

      // Color overlay on target cells
      const isAttack = hoveredAction.type === BotActionType.ATTACK;
      for (const move of hoveredAction.moves) {
        if (isAttack) {
          highlightCell(move.toX, move.toY, 220, 50, 50, 0.30);
        } else {
          highlightCell(move.toX, move.toY, 50, 200, 50, 0.30);
        }
      }

      // Red overlay on enemy cells
      if (hoveredAction.enemyCells && hoveredAction.enemyCells.length > 0) {
        for (const ec of hoveredAction.enemyCells) {
          highlightCell(ec.x, ec.y, 220, 50, 50, 0.30);
        }
      }

      // Green overlay on protected cells
      if (hoveredAction.protectedCells && hoveredAction.protectedCells.length > 0) {
        for (const pc of hoveredAction.protectedCells) {
          highlightCell(pc.x, pc.y, 50, 200, 50, 0.30);
        }
      }

      // Draw move lines with arrowheads (always team color: P1=green)
      const lineW = Math.max(1, cellSize * 0.04);
      const arrowSize = cellSize * 0.18;
      const lineColor = currentPlayer === EPlayer.P1
        ? 'rgba(80, 220, 80, 0.55)'
        : 'rgba(220, 80, 80, 0.55)';

      ctx.strokeStyle = lineColor;
      ctx.fillStyle = lineColor;
      ctx.lineWidth = lineW;
      ctx.lineCap = 'round';

      // Batch lines
      ctx.beginPath();
      for (const move of hoveredAction.moves) {
        const fx = offsetX + (move.fromX + 0.5) * cellSize;
        const fy = offsetY + (move.fromY + 0.5) * cellSize;
        const tx = offsetX + (move.toX + 0.5) * cellSize;
        const ty = offsetY + (move.toY + 0.5) * cellSize;
        ctx.moveTo(fx, fy);
        ctx.lineTo(tx, ty);
      }
      ctx.stroke();

      // Arrowheads
      for (const move of hoveredAction.moves) {
        const fx = offsetX + (move.fromX + 0.5) * cellSize;
        const fy = offsetY + (move.fromY + 0.5) * cellSize;
        const tx = offsetX + (move.toX + 0.5) * cellSize;
        const ty = offsetY + (move.toY + 0.5) * cellSize;
        const angle = Math.atan2(ty - fy, tx - fx);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(
          tx - arrowSize * Math.cos(angle - 0.4),
          ty - arrowSize * Math.sin(angle - 0.4),
        );
        ctx.lineTo(
          tx - arrowSize * Math.cos(angle + 0.4),
          ty - arrowSize * Math.sin(angle + 0.4),
        );
        ctx.closePath();
        ctx.fill();
      }

      // Reset smooth sepia so it doesn't flash when hover ends
      sepiaAlphaRef.current = 0;
    }

    // Update and draw particles (after all pieces, so particles render on top)
    particles.update(dt);
    particles.draw(ctx);
  }, []);

  function drawPieceFromSnapshot(
    ctx: CanvasRenderingContext2D,
    snap: PieceSnapshot,
    x: number,
    y: number,
    cellSize: number,
    alpha: number = 1,
    scale: number = 1,
  ) {
    pieceRendererRef.current.draw(
      ctx, x, y, cellSize,
      snap.seed, snap.lvl, snap.owner, snap.king, snap.symbol,
      alpha, scale,
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ touchAction: 'none' }}
      />
      {/* Bot Action Panel overlay (left side) */}
      {botActionsEnabled && (
        <div className="absolute top-4 left-4">
          <BotActionPanel />
        </div>
      )}
      {/* Zoom controls overlay */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button
          onClick={zoomIn}
          className="w-9 h-9 bg-gray-800/80 hover:bg-gray-700 text-white rounded flex items-center justify-center text-lg font-bold select-none"
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          className="w-9 h-9 bg-gray-800/80 hover:bg-gray-700 text-white rounded flex items-center justify-center text-lg font-bold select-none"
          title="Zoom out"
        >
          −
        </button>
        <button
          onClick={fitView}
          className="w-9 h-9 bg-gray-800/80 hover:bg-gray-700 text-white rounded flex items-center justify-center text-xs font-bold select-none"
          title="Fit to view"
        >
          Fit
        </button>
      </div>
    </div>
  );
}
