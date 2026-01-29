/**
 * Xì Dách Score Tracker - Context Provider
 * Manages state and actions for the score tracker
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import {
  XiDachSession,
  XiDachPlayer,
  XiDachMatch,
  XiDachPlayerResult,
  XiDachSettings,
} from '../../types/xi-dach-score.types';
import {
  getAllSessions,
  saveSession,
  deleteSession as deleteSessionFromStorage,
  createSession,
  createPlayer,
  generateId,
  getTimestamp,
  recalculatePlayerScores,
  shouldAutoRotateDealer,
  getNextDealerId,
} from '../../utils/xi-dach-score-storage';

// ============== TYPES ==============

type ViewMode = 'list' | 'setup' | 'playing' | 'history' | 'summary';

interface XiDachState {
  sessions: XiDachSession[];
  currentSessionId: string | null;
  viewMode: ViewMode;
  loading: boolean;
  error: string | null;
}

type XiDachAction =
  | { type: 'SET_SESSIONS'; payload: XiDachSession[] }
  | { type: 'SET_CURRENT_SESSION'; payload: string | null }
  | { type: 'SET_VIEW_MODE'; payload: ViewMode }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_SESSION'; payload: XiDachSession }
  | { type: 'ADD_SESSION'; payload: XiDachSession }
  | { type: 'DELETE_SESSION'; payload: string };

// Pending dealer rotation info
interface PendingDealerRotation {
  suggestedDealerId: string;
  suggestedDealerName: string;
}

interface XiDachContextValue extends XiDachState {
  currentSession: XiDachSession | null;
  // Pending dealer rotation
  pendingDealerRotation: PendingDealerRotation | null;
  confirmDealerRotation: () => void;
  cancelDealerRotation: () => void;
  changePendingDealer: (playerId: string) => void;
  // Navigation
  goToList: () => void;
  goToSetup: () => void;
  goToPlaying: (sessionId: string) => void;
  goToHistory: () => void;
  goToSummary: () => void;
  // Session CRUD
  createNewSession: (name: string, settings?: Partial<XiDachSettings>) => XiDachSession;
  deleteSession: (id: string) => void;
  updateCurrentSession: (updates: Partial<XiDachSession>) => void;
  // Player management
  addPlayer: (name: string, baseScore?: number) => void;
  removePlayer: (playerId: string) => void;
  updatePlayer: (playerId: string, updates: Partial<XiDachPlayer>) => void;
  setDealer: (playerId: string) => void;
  // Game actions
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  endGame: () => void;
  addMatch: (results: XiDachPlayerResult[]) => void;
  editMatch: (matchId: string, results: XiDachPlayerResult[]) => void;
  deleteLastMatch: () => void;
  // Refresh
  refreshSessions: () => void;
}

// ============== INITIAL STATE ==============

const initialState: XiDachState = {
  sessions: [],
  currentSessionId: null,
  viewMode: 'list',
  loading: true,
  error: null,
};

// ============== REDUCER ==============

function xiDachReducer(state: XiDachState, action: XiDachAction): XiDachState {
  switch (action.type) {
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSessionId: action.payload };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'UPDATE_SESSION':
      return {
        ...state,
        sessions: state.sessions.map((s) =>
          s.id === action.payload.id ? action.payload : s
        ),
      };
    case 'ADD_SESSION':
      return {
        ...state,
        sessions: [...state.sessions, action.payload],
      };
    case 'DELETE_SESSION':
      return {
        ...state,
        sessions: state.sessions.filter((s) => s.id !== action.payload),
        currentSessionId:
          state.currentSessionId === action.payload ? null : state.currentSessionId,
      };
    default:
      return state;
  }
}

// ============== CONTEXT ==============

const XiDachContext = createContext<XiDachContextValue | null>(null);

// ============== PROVIDER ==============

export const XiDachScoreProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(xiDachReducer, initialState);
  const [pendingDealerRotation, setPendingDealerRotation] = useState<PendingDealerRotation | null>(null);

  // Load sessions on mount
  useEffect(() => {
    const sessions = getAllSessions();
    dispatch({ type: 'SET_SESSIONS', payload: sessions });
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  // Computed current session
  const currentSession = state.currentSessionId
    ? state.sessions.find((s) => s.id === state.currentSessionId) || null
    : null;

  // ============== NAVIGATION ==============

  const goToList = useCallback(() => {
    dispatch({ type: 'SET_CURRENT_SESSION', payload: null });
    dispatch({ type: 'SET_VIEW_MODE', payload: 'list' });
  }, []);

  const goToSetup = useCallback(() => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'setup' });
  }, []);

  const goToPlaying = useCallback((sessionId: string) => {
    dispatch({ type: 'SET_CURRENT_SESSION', payload: sessionId });
    // Check if session is ended - if so, show summary instead
    const session = state.sessions.find((s) => s.id === sessionId);
    if (session?.status === 'ended') {
      dispatch({ type: 'SET_VIEW_MODE', payload: 'summary' });
    } else {
      dispatch({ type: 'SET_VIEW_MODE', payload: 'playing' });
    }
  }, [state.sessions]);

  const goToHistory = useCallback(() => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'history' });
  }, []);

  const goToSummary = useCallback(() => {
    dispatch({ type: 'SET_VIEW_MODE', payload: 'summary' });
  }, []);

  // ============== SESSION CRUD ==============

  const createNewSession = useCallback(
    (name: string, settings?: Partial<XiDachSettings>): XiDachSession => {
      const session = createSession(name, settings);
      saveSession(session);
      dispatch({ type: 'ADD_SESSION', payload: session });
      return session;
    },
    []
  );

  const deleteSessionAction = useCallback((id: string) => {
    deleteSessionFromStorage(id);
    dispatch({ type: 'DELETE_SESSION', payload: id });
  }, []);

  const updateCurrentSession = useCallback(
    (updates: Partial<XiDachSession>) => {
      if (!currentSession) return;

      const updated = {
        ...currentSession,
        ...updates,
        updatedAt: getTimestamp(),
      };
      saveSession(updated);
      dispatch({ type: 'UPDATE_SESSION', payload: updated });
    },
    [currentSession]
  );

  // ============== PLAYER MANAGEMENT ==============

  const addPlayer = useCallback(
    (name: string, baseScore: number = 0) => {
      if (!currentSession) return;

      const player = createPlayer(name, baseScore);
      const updated = {
        ...currentSession,
        players: [...currentSession.players, player],
        updatedAt: getTimestamp(),
      };
      saveSession(updated);
      dispatch({ type: 'UPDATE_SESSION', payload: updated });
    },
    [currentSession]
  );

  const removePlayer = useCallback(
    (playerId: string) => {
      if (!currentSession) return;

      const updated = {
        ...currentSession,
        players: currentSession.players.map((p) =>
          p.id === playerId ? { ...p, isActive: false } : p
        ),
        updatedAt: getTimestamp(),
      };
      saveSession(updated);
      dispatch({ type: 'UPDATE_SESSION', payload: updated });
    },
    [currentSession]
  );

  const updatePlayer = useCallback(
    (playerId: string, updates: Partial<XiDachPlayer>) => {
      if (!currentSession) return;

      const updatedPlayers = currentSession.players.map((p) =>
        p.id === playerId ? { ...p, ...updates } : p
      );

      // Recalculate if baseScore changed
      let updated: XiDachSession = {
        ...currentSession,
        players: updatedPlayers,
        updatedAt: getTimestamp(),
      };

      if ('baseScore' in updates) {
        updated = recalculatePlayerScores(updated);
      }

      saveSession(updated);
      dispatch({ type: 'UPDATE_SESSION', payload: updated });
    },
    [currentSession]
  );

  const setDealer = useCallback(
    (playerId: string) => {
      if (!currentSession) return;

      const updated = {
        ...currentSession,
        currentDealerId: playerId,
        updatedAt: getTimestamp(),
      };
      saveSession(updated);
      dispatch({ type: 'UPDATE_SESSION', payload: updated });
    },
    [currentSession]
  );

  // ============== GAME ACTIONS ==============

  const startGame = useCallback(() => {
    if (!currentSession) return;
    if (currentSession.players.filter((p) => p.isActive).length < 2) {
      dispatch({ type: 'SET_ERROR', payload: 'Cần ít nhất 2 người chơi' });
      return;
    }

    const updated = {
      ...currentSession,
      status: 'playing' as const,
      updatedAt: getTimestamp(),
    };
    saveSession(updated);
    dispatch({ type: 'UPDATE_SESSION', payload: updated });
  }, [currentSession]);

  const pauseGame = useCallback(() => {
    if (!currentSession) return;

    const updated = {
      ...currentSession,
      status: 'paused' as const,
      updatedAt: getTimestamp(),
    };
    saveSession(updated);
    dispatch({ type: 'UPDATE_SESSION', payload: updated });
  }, [currentSession]);

  const resumeGame = useCallback(() => {
    if (!currentSession) return;

    const updated = {
      ...currentSession,
      status: 'playing' as const,
      updatedAt: getTimestamp(),
    };
    saveSession(updated);
    dispatch({ type: 'UPDATE_SESSION', payload: updated });
  }, [currentSession]);

  const endGame = useCallback(() => {
    if (!currentSession) return;

    const updated = {
      ...currentSession,
      status: 'ended' as const,
      updatedAt: getTimestamp(),
    };
    saveSession(updated);
    dispatch({ type: 'UPDATE_SESSION', payload: updated });
  }, [currentSession]);

  const addMatch = useCallback(
    (results: XiDachPlayerResult[]) => {
      if (!currentSession) return;

      const match: XiDachMatch = {
        id: generateId(),
        matchNumber: currentSession.matches.length + 1,
        dealerId: currentSession.currentDealerId || '',
        results,
        timestamp: getTimestamp(),
      };

      let updated: XiDachSession = {
        ...currentSession,
        matches: [...currentSession.matches, match],
        updatedAt: getTimestamp(),
      };

      // Recalculate scores
      updated = recalculatePlayerScores(updated);

      // Save session first (without dealer change)
      saveSession(updated);
      dispatch({ type: 'UPDATE_SESSION', payload: updated });

      // Check for auto-rotate dealer - show confirmation modal instead of auto-rotating
      if (shouldAutoRotateDealer(updated)) {
        const nextDealerId = getNextDealerId(updated);
        if (nextDealerId) {
          const nextDealer = updated.players.find(p => p.id === nextDealerId);
          if (nextDealer) {
            setPendingDealerRotation({
              suggestedDealerId: nextDealerId,
              suggestedDealerName: nextDealer.name,
            });
          }
        }
      }
    },
    [currentSession]
  );

  const editMatch = useCallback(
    (matchId: string, results: XiDachPlayerResult[]) => {
      if (!currentSession) return;

      const updatedMatches = currentSession.matches.map((m) =>
        m.id === matchId
          ? { ...m, results, editedAt: getTimestamp() }
          : m
      );

      let updated: XiDachSession = {
        ...currentSession,
        matches: updatedMatches,
        updatedAt: getTimestamp(),
      };

      // Recalculate all scores
      updated = recalculatePlayerScores(updated);

      saveSession(updated);
      dispatch({ type: 'UPDATE_SESSION', payload: updated });
    },
    [currentSession]
  );

  const deleteLastMatch = useCallback(() => {
    if (!currentSession || currentSession.matches.length === 0) return;

    const updatedMatches = currentSession.matches.slice(0, -1);

    let updated: XiDachSession = {
      ...currentSession,
      matches: updatedMatches,
      updatedAt: getTimestamp(),
    };

    // Recalculate all scores
    updated = recalculatePlayerScores(updated);

    saveSession(updated);
    dispatch({ type: 'UPDATE_SESSION', payload: updated });
  }, [currentSession]);

  // ============== DEALER ROTATION HANDLERS ==============

  const confirmDealerRotation = useCallback(() => {
    if (!currentSession || !pendingDealerRotation) return;

    const updated = {
      ...currentSession,
      currentDealerId: pendingDealerRotation.suggestedDealerId,
      updatedAt: getTimestamp(),
    };
    saveSession(updated);
    dispatch({ type: 'UPDATE_SESSION', payload: updated });
    setPendingDealerRotation(null);
  }, [currentSession, pendingDealerRotation]);

  const cancelDealerRotation = useCallback(() => {
    setPendingDealerRotation(null);
  }, []);

  const changePendingDealer = useCallback((playerId: string) => {
    if (!currentSession) return;
    const player = currentSession.players.find(p => p.id === playerId);
    if (player) {
      setPendingDealerRotation({
        suggestedDealerId: playerId,
        suggestedDealerName: player.name,
      });
    }
  }, [currentSession]);

  // ============== REFRESH ==============

  const refreshSessions = useCallback(() => {
    const sessions = getAllSessions();
    dispatch({ type: 'SET_SESSIONS', payload: sessions });
  }, []);

  // ============== VALUE ==============

  const value: XiDachContextValue = {
    ...state,
    currentSession,
    pendingDealerRotation,
    confirmDealerRotation,
    cancelDealerRotation,
    changePendingDealer,
    goToList,
    goToSetup,
    goToPlaying,
    goToHistory,
    goToSummary,
    createNewSession,
    deleteSession: deleteSessionAction,
    updateCurrentSession,
    addPlayer,
    removePlayer,
    updatePlayer,
    setDealer,
    startGame,
    pauseGame,
    resumeGame,
    endGame,
    addMatch,
    editMatch,
    deleteLastMatch,
    refreshSessions,
  };

  return (
    <XiDachContext.Provider value={value}>{children}</XiDachContext.Provider>
  );
};

// ============== HOOK ==============

export const useXiDachScore = (): XiDachContextValue => {
  const context = useContext(XiDachContext);
  if (!context) {
    throw new Error('useXiDachScore must be used within XiDachScoreProvider');
  }
  return context;
};

export default XiDachScoreProvider;
