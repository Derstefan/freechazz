import { create } from 'zustand';
import { Game } from '../engine/game/Game';
import { GameBuilder } from '../engine/game/GameBuilder';
import { FormationGenerator } from '../engine/generators/FormationGenerator';
import { EPlayer } from '../engine/core/EPlayer';
import { ESize, type BoardSize, type ESizeName } from '../engine/core/ESize';
import { Pos } from '../engine/core/Pos';
import type { Piece } from '../engine/pieces/Piece';
import type { ActionPos } from '../engine/core/ActionPos';
import { resetPieceIdCounter } from '../engine/pieces/Piece';
import { BetterBotClean } from '../bot/BetterBotClean';
import type { BotRequest, BotWorkerResponse, MoveData } from '../bot/BotWorkerMessages';
import type { DrawEvent } from '../engine/events/DrawEvent';
import { SeededRandom } from '../engine/generators/SeededRandom';
import { computeBotActions } from '../engine/botactions/BotActionComputer';
import { chooseBestAction } from '../engine/botactions/ActionBot';
import type { BotActionInfo } from '../engine/botactions/BotActionType';

export type GameMode = 'hotseat' | 'bot';

export interface MaterialSnapshot {
  turn: number;
  p1Material: number;
  p2Material: number;
  p1Count: number;
  p2Count: number;
}

function captureMaterialSnapshot(game: Game): MaterialSnapshot {
  const p1Pieces = game.state.getAllPiecesFrom(EPlayer.P1);
  const p2Pieces = game.state.getAllPiecesFrom(EPlayer.P2);
  return {
    turn: game.getTurns(),
    p1Material: p1Pieces.reduce((sum, p) => sum + p.lvl, 0),
    p2Material: p2Pieces.reduce((sum, p) => sum + p.lvl, 0),
    p1Count: p1Pieces.length,
    p2Count: p2Pieces.length,
  };
}

interface GameConfig {
  sizeName: ESizeName;
  mode: GameMode;
  botDepth: number;
  seed: number | null;
  samePieces: boolean;
  botActions: boolean;
}

interface GameStoreState {
  config: GameConfig;
  game: Game | null;
  selectedPiece: Piece | null;
  possibleMoves: ActionPos[];
  winner: EPlayer | null;
  botThinking: boolean;
  botWorker: Worker | null;
  moveHistory: MoveData[];
  formationSeed1: number;
  formationSeed2: number;
  firstTurn: EPlayer;
  pendingDrawEvent: DrawEvent | null;

  computedActions: BotActionInfo[] | null;
  pendingParallelDraw: boolean;
  hoveredAction: BotActionInfo | null;
  materialHistory: MaterialSnapshot[];

  setConfig: (config: Partial<GameConfig>) => void;
  startGame: () => void;
  selectPiece: (pos: Pos) => void;
  tryMove: (pos: Pos) => void;
  clickCell: (pos: Pos) => void;
  undoMove: () => void;
  cleanup: () => void;
  executeBotAction: (action: BotActionInfo) => void;
  setHoveredAction: (action: BotActionInfo | null) => void;
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  config: {
    sizeName: 'tiny',
    mode: 'bot',
    botDepth: 2,
    seed: null,
    samePieces: true,
    botActions: false,
  },

  game: null,
  selectedPiece: null,
  possibleMoves: [],
  winner: null,
  botThinking: false,
  botWorker: null,
  moveHistory: [],
  formationSeed1: 0,
  formationSeed2: 0,
  firstTurn: EPlayer.P1,
  pendingDrawEvent: null,
  computedActions: null,
  pendingParallelDraw: false,
  hoveredAction: null,
  materialHistory: [],

  setConfig: (partial) => {
    set((state) => ({
      config: { ...state.config, ...partial },
    }));
  },

  startGame: () => {
    const { config } = get();
    const state = get();

    if (state.botWorker) {
      state.botWorker.terminate();
    }

    resetPieceIdCounter();

    const size: BoardSize = ESize[config.sizeName];
    const baseSeed = config.seed ?? Math.floor(Math.random() * 999999999);
    const seed1 = baseSeed;
    const seed2 = config.samePieces ? baseSeed : baseSeed + 1;

    const gen1 = new FormationGenerator(seed1, size);
    const formation1 = gen1.generate();

    const gen2 = new FormationGenerator(seed2, size);
    const formation2 = gen2.generate();

    const firstTurn = EPlayer.P1;
    const game = new GameBuilder(formation1, formation2)
      .firstPlayer(firstTurn)
      .build();

    const computedActions = config.botActions
      ? computeBotActions(game.state, EPlayer.P1, new SeededRandom(seed1 + 777))
      : null;

    set({
      game,
      selectedPiece: null,
      possibleMoves: [],
      winner: null,
      botThinking: false,
      botWorker: null,
      moveHistory: [],
      formationSeed1: seed1,
      formationSeed2: seed2,
      firstTurn,
      pendingDrawEvent: null,
      computedActions,
      pendingParallelDraw: false,
      materialHistory: [captureMaterialSnapshot(game)],
    });
  },

  selectPiece: (pos) => {
    const { game } = get();
    if (!game) return;

    const piece = game.state.pieceAt(pos);
    if (!piece) {
      set({ selectedPiece: null, possibleMoves: [] });
      return;
    }

    set({
      selectedPiece: piece,
      possibleMoves: [...piece.moveSet.getPossibleMoves()],
    });
  },

  tryMove: (pos) => {
    const { game, selectedPiece, config, botThinking } = get();
    if (!game || !selectedPiece || botThinking) return;
    if (game.getWinner()) return;

    if (config.mode === 'bot' && game.getPlayersTurn() !== EPlayer.P1) return;

    const fromPos = selectedPiece.pos;
    const success = game.play(fromPos, pos);

    if (success) {
      const drawEvent = game.getLastDrawEvent();
      const moveHistory = [...get().moveHistory, {
        fromX: fromPos.x, fromY: fromPos.y,
        toX: pos.x, toY: pos.y,
      }];

      const winner = game.getWinner();

      set({
        selectedPiece: null,
        possibleMoves: [],
        winner,
        moveHistory,
        game,
        pendingDrawEvent: drawEvent,
        materialHistory: [...get().materialHistory, captureMaterialSnapshot(game)],
      });

      // Bot trigger is deferred to after animation completes (via GameCanvas onComplete)
      // For hotseat mode or if no animation, trigger immediately
      if (!drawEvent && !winner && config.mode === 'bot' && game.getPlayersTurn() === EPlayer.P2) {
        triggerBot();
      }
    }
  },

  clickCell: (pos) => {
    const { game, selectedPiece, possibleMoves, botThinking, config } = get();
    if (!game || botThinking) return;
    if (game.getWinner()) return;
    // In botActions mode, only buttons control movement
    if (config.botActions) {
      // Still allow selecting pieces for inspection
      const piece = game.state.pieceAt(pos);
      if (piece) {
        get().selectPiece(pos);
      } else {
        set({ selectedPiece: null, possibleMoves: [] });
      }
      return;
    }

    if (selectedPiece && possibleMoves.some(m => m.x === pos.x && m.y === pos.y)) {
      get().tryMove(pos);
      return;
    }

    const piece = game.state.pieceAt(pos);
    if (piece) {
      get().selectPiece(pos);
    } else {
      set({ selectedPiece: null, possibleMoves: [] });
    }
  },

  undoMove: () => {
    const { game, config } = get();
    if (!game) return;
    if (game.getTurns() === 0) return;

    if (config.mode === 'bot' && game.getTurns() >= 2) {
      game.undo();
      game.undo();
      const moveHistory = get().moveHistory.slice(0, -2);
      const currentTurn = game.getTurns();
      const trimmed = get().materialHistory.filter(s => s.turn <= currentTurn);
      set({
        selectedPiece: null,
        possibleMoves: [],
        winner: null,
        moveHistory,
        game,
        pendingDrawEvent: null,
        materialHistory: [...trimmed, captureMaterialSnapshot(game)],
      });
    } else {
      game.undo();
      const moveHistory = get().moveHistory.slice(0, -1);
      const currentTurn = game.getTurns();
      const trimmed = get().materialHistory.filter(s => s.turn <= currentTurn);
      set({
        selectedPiece: null,
        possibleMoves: [],
        winner: null,
        moveHistory,
        game,
        pendingDrawEvent: null,
        materialHistory: [...trimmed, captureMaterialSnapshot(game)],
      });
    }
  },

  setHoveredAction: (action) => {
    set({ hoveredAction: action });
  },

  executeBotAction: (action) => {
    const { game, config, botThinking } = get();
    if (!game || botThinking) return;
    if (game.getWinner()) return;
    if (action.moves.length === 0) return;

    const success = game.playBatch(action.moves);
    if (!success) return;

    const drawEvent = game.getLastDrawEvent();
    const winner = game.getWinner();

    set({
      selectedPiece: null,
      possibleMoves: [],
      winner,
      game,
      pendingDrawEvent: drawEvent,
      pendingParallelDraw: true,
      computedActions: null,
      hoveredAction: null,
      materialHistory: [...get().materialHistory, captureMaterialSnapshot(game)],
    });

    // If no winner and bot mode, trigger bot action after animation
    // (handled in GameCanvas onComplete callback via triggerBotAction)
    if (!drawEvent && !winner && config.mode === 'bot' && game.getPlayersTurn() === EPlayer.P2) {
      triggerBotAction();
    }
  },

  cleanup: () => {
    const { botWorker } = get();
    if (botWorker) {
      botWorker.terminate();
    }
    set({
      game: null,
      botWorker: null,
      botThinking: false,
      selectedPiece: null,
      possibleMoves: [],
      pendingDrawEvent: null,
      computedActions: null,
      pendingParallelDraw: false,
      hoveredAction: null,
      materialHistory: [],
    });
  },
}));

// Exported so GameCanvas can call it after animation completes
export function triggerBot() {
  const state = useGameStore.getState();
  const { game, config, formationSeed1, formationSeed2, moveHistory, firstTurn } = state;
  if (!game) return;

  useGameStore.setState({ botThinking: true });

  // Use setTimeout to let the UI update before blocking on bot computation
  setTimeout(() => {
    try {
      const worker = new Worker(
        new URL('../bot/bot.worker.ts', import.meta.url),
        { type: 'module' },
      );

      worker.onmessage = (e: MessageEvent<BotWorkerResponse>) => {
        const response = e.data;
        const currentState = useGameStore.getState();
        const currentGame = currentState.game;
        if (!currentGame) return;

        if (response.type === 'result') {
          const fromPos = new Pos(response.fromX, response.fromY);
          const toPos = new Pos(response.toX, response.toY);
          const success = currentGame.play(fromPos, toPos);

          if (success) {
            const drawEvent = currentGame.getLastDrawEvent();
            const newMoveHistory = [...currentState.moveHistory, {
              fromX: response.fromX, fromY: response.fromY,
              toX: response.toX, toY: response.toY,
            }];

            useGameStore.setState({
              winner: currentGame.getWinner(),
              botThinking: false,
              botWorker: null,
              moveHistory: newMoveHistory,
              game: currentGame,
              pendingDrawEvent: drawEvent,
              materialHistory: [...currentState.materialHistory, captureMaterialSnapshot(currentGame)],
            });
          } else {
            useGameStore.setState({ botThinking: false, botWorker: null });
          }
        } else {
          currentGame.surrender();
          useGameStore.setState({
            winner: currentGame.getWinner(),
            botThinking: false,
            botWorker: null,
          });
        }

        worker.terminate();
      };

      worker.onerror = () => {
        runBotSync();
        worker.terminate();
      };

      const request: BotRequest = {
        type: 'compute',
        gameSnapshot: {
          formation1Data: {
            sizeName: config.sizeName,
            seed: formationSeed1,
            samePieces: config.samePieces,
            formationSeed: formationSeed1,
          },
          formation2Data: {
            sizeName: config.sizeName,
            seed: formationSeed2,
            samePieces: config.samePieces,
            formationSeed: formationSeed2,
          },
          moves: moveHistory,
          firstTurn,
        },
        botPlayer: EPlayer.P2,
        maxDepth: config.botDepth,
      };

      useGameStore.setState({ botWorker: worker });
      worker.postMessage(request);
    } catch {
      runBotSync();
    }
  }, 10);
}

function runBotSync() {
  const state = useGameStore.getState();
  const { game, config } = state;
  if (!game) return;

  const bot = new BetterBotClean(EPlayer.P2, config.botDepth);
  const gameCopy = game.copy();
  const result = bot.doDrawOn(gameCopy);

  if (!result) {
    game.surrender();
    useGameStore.setState({
      winner: game.getWinner(),
      botThinking: false,
    });
  } else {
    const fromPos = result.fromPos;
    const toPos = result.toPos;
    game.play(fromPos, toPos);

    const drawEvent = game.getLastDrawEvent();
    const newMoveHistory = [...state.moveHistory, {
      fromX: fromPos.x, fromY: fromPos.y,
      toX: toPos.x, toY: toPos.y,
    }];

    useGameStore.setState({
      winner: game.getWinner(),
      botThinking: false,
      moveHistory: newMoveHistory,
      game,
      pendingDrawEvent: drawEvent,
      materialHistory: [...state.materialHistory, captureMaterialSnapshot(game)],
    });
  }
}

/**
 * Bot chooses and executes best mass-action (botActions mode).
 * Runs synchronously — only 5 evaluations, no worker needed.
 */
export function triggerBotAction() {
  const state = useGameStore.getState();
  const { game, formationSeed1 } = state;
  if (!game) return;

  useGameStore.setState({ botThinking: true });

  setTimeout(() => {
    const currentState = useGameStore.getState();
    const currentGame = currentState.game;
    if (!currentGame) return;

    const rand = new SeededRandom(formationSeed1 + currentGame.getTurns() * 31);
    const action = chooseBestAction(currentGame, EPlayer.P2, rand);

    if (action.moves.length === 0) {
      currentGame.surrender();
      useGameStore.setState({
        winner: currentGame.getWinner(),
        botThinking: false,
      });
      return;
    }

    currentGame.playBatch(action.moves);
    const drawEvent = currentGame.getLastDrawEvent();
    const winner = currentGame.getWinner();

    // Recompute actions for P1 after bot's turn
    const p1Actions = !winner
      ? computeBotActions(currentGame.state, EPlayer.P1, new SeededRandom(formationSeed1 + currentGame.getTurns() * 17))
      : null;

    useGameStore.setState({
      winner,
      botThinking: false,
      game: currentGame,
      pendingDrawEvent: drawEvent,
      pendingParallelDraw: true,
      computedActions: p1Actions,
      materialHistory: [...useGameStore.getState().materialHistory, captureMaterialSnapshot(currentGame)],
    });
  }, 10);
}
