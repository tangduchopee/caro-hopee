import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  Chip,
  CircularProgress,
  Paper,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { gameApi } from '../../services/api';
import { GameHistory } from '../../types/game.types';
import { logger } from '../../utils/logger';

interface HistoryModalProps {
  open: boolean;
  onClose: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ open, onClose }) => {
  const [history, setHistory] = useState<GameHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameHistory | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  useEffect(() => {
    if (open) {
      loadHistory();
    } else {
      // Reset when modal closes
      setHistory([]);
      setSelectedGame(null);
      setViewMode('list');
    }
  }, [open]);

  const loadHistory = async (): Promise<void> => {
    setLoading(true);
    try {
      logger.log('[HistoryModal] Loading game history...');
      const data = await gameApi.getGameHistory();
      logger.log('[HistoryModal] History loaded:', data);
      setHistory(data.history || []);
    } catch (error: any) {
      logger.error('[HistoryModal] Failed to load game history:', error);
      logger.error('[HistoryModal] Error details:', error.response?.data || error.message);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewBoard = (game: GameHistory): void => {
    setSelectedGame(game);
    setViewMode('board');
  };

  const handleBackToList = (): void => {
    setViewMode('list');
    setSelectedGame(null);
  };

  const getResultColor = (result: 'win' | 'loss' | 'draw'): string => {
    switch (result) {
      case 'win':
        return '#a8e6cf';
      case 'loss':
        return '#ffaaa5';
      case 'draw':
        return '#ffd93d';
      default:
        return '#8a9ba8';
    }
  };

  const getResultLabel = (result: 'win' | 'loss' | 'draw'): string => {
    switch (result) {
      case 'win':
        return 'Win';
      case 'loss':
        return 'Loss';
      case 'draw':
        return 'Draw';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          // Solid color instead of blur for better paint performance
          background: '#f5f7f9',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
          borderBottom: '2px solid rgba(126, 200, 227, 0.2)',
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#2c3e50' }}>
          {viewMode === 'list' ? '📜 Game History' : '🎯 Game Board'}
        </Typography>
        {viewMode === 'board' && (
          <Button
            onClick={handleBackToList}
            size="small"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            ← Back to List
          </Button>
        )}
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : viewMode === 'list' ? (
          <Box sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {history.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" sx={{ color: '#8a9ba8' }}>
                  No game history found. Play some games to see your history here!
                </Typography>
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {history.map((game, index) => (
                  <ListItem
                    key={game._id}
                    disablePadding
                    sx={{
                      borderBottom: '1px solid rgba(126, 200, 227, 0.1)',
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <ListItemButton
                      onClick={() => handleViewBoard(game)}
                      sx={{
                        py: 2,
                        px: 3,
                        '&:hover': {
                          bgcolor: 'rgba(126, 200, 227, 0.08)',
                        },
                      }}
                    >
                      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            bgcolor: getResultColor(game.result),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: '#2c3e50',
                            fontSize: '0.9rem',
                          }}
                        >
                          {index + 1}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Chip
                              label={getResultLabel(game.result)}
                              size="small"
                              sx={{
                                bgcolor: getResultColor(game.result),
                                color: '#2c3e50',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                height: 24,
                              }}
                            />
                            <Typography variant="body2" sx={{ color: '#8a9ba8', fontSize: '0.8rem' }}>
                              vs {game.opponentUsername}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: '#8a9ba8', fontSize: '0.75rem' }}>
                            {formatDate(game.finishedAt || game.createdAt)} • {game.boardSize}x{game.boardSize} board
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#5a6a7a', fontWeight: 600 }}>
                          Score: {game.score.player1} - {game.score.player2}
                        </Typography>
                      </Box>
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        ) : selectedGame ? (
          <Box sx={{ p: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 2,
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 3,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50', mb: 0.5 }}>
                    Game Details
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8a9ba8' }}>
                    {formatDate(selectedGame.finishedAt || selectedGame.createdAt)}
                  </Typography>
                </Box>
                <Chip
                  label={getResultLabel(selectedGame.result)}
                  sx={{
                    bgcolor: getResultColor(selectedGame.result),
                    color: '#2c3e50',
                    fontWeight: 700,
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: '#8a9ba8', display: 'block' }}>
                    Opponent
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                    {selectedGame.opponentUsername}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#8a9ba8', display: 'block' }}>
                    Board Size
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                    {selectedGame.boardSize}x{selectedGame.boardSize}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#8a9ba8', display: 'block' }}>
                    Final Score
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                    {selectedGame.score.player1} - {selectedGame.score.player2}
                  </Typography>
                </Box>
              </Box>
            </Paper>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 3,
                p: 2,
              }}
            >
              <GameBoardStatic 
                board={selectedGame.board} 
                boardSize={selectedGame.boardSize}
                winningLine={selectedGame.winningLine}
              />
            </Box>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(126, 200, 227, 0.1)' }}>
        <Button onClick={onClose} variant="contained" sx={{ textTransform: 'none', fontWeight: 600 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Static GameBoard component for viewing finished games
interface GameBoardStaticProps {
  board: number[][];
  boardSize: number;
  winningLine?: Array<{ row: number; col: number }>;
}

const GameBoardStatic: React.FC<GameBoardStaticProps> = ({ board, boardSize, winningLine }) => {
  const [cellSize, setCellSize] = useState(30);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Calculate cell size based on board size
    const maxSize = Math.min(500, window.innerWidth * 0.6);
    const calculatedSize = Math.floor(maxSize / boardSize);
    setCellSize(Math.max(20, Math.min(calculatedSize, 40)));
  }, [boardSize]);

  const getCellContent = (value: number): string => {
    if (value === 1) return '✕';
    if (value === 2) return '○';
    return '';
  };

  const getCellColor = (value: number): string => {
    if (value === 1) return '#5ba8c7';
    if (value === 2) return '#88d6b7';
    return 'transparent';
  };


  return (
    <Box
      sx={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: `repeat(${boardSize}, 1fr)`,
        gap: 0,
        border: '3px solid #7ec8e3',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: 'inset 0 2px 8px rgba(126, 200, 227, 0.1)',
      }}
      ref={boardRef}
    >
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          return (
            <Box
              key={`${rowIndex}-${colIndex}`}
              sx={{
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                minWidth: `${cellSize}px`,
                minHeight: `${cellSize}px`,
                border: '1px solid rgba(126, 200, 227, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#ffffff',
                fontSize: `${cellSize * 0.65}px`,
                fontWeight: 800,
                color: getCellColor(cell),
              }}
            >
              {getCellContent(cell)}
            </Box>
          );
        })
      )}
      {/* Winning line overlay - rounded rectangle for horizontal/vertical, special shape for diagonal */}
      {winningLine && winningLine.length >= 5 && (() => {
        // Determine direction: horizontal, vertical, or diagonal
        const rows = winningLine.map(c => c.row);
        const cols = winningLine.map(c => c.col);
        const uniqueRows = Array.from(new Set(rows));
        const uniqueCols = Array.from(new Set(cols));
        
        const isHorizontal = uniqueRows.length === 1; // All cells in same row
        const isVertical = uniqueCols.length === 1; // All cells in same column
        const isDiagonal = !isHorizontal && !isVertical;
        
        if (isDiagonal) {
          // Diagonal line: draw a special diamond/rhombus shape with pointed ends
          // Sort cells to get first and last
          const sortedCells = [...winningLine].sort((a, b) => {
            if (a.row !== b.row) return a.row - b.row;
            return a.col - b.col;
          });
          
          const firstCell = sortedCells[0];
          const lastCell = sortedCells[sortedCells.length - 1];
          
          // Determine diagonal direction
          const isMainDiagonal = (lastCell.col - firstCell.col) === (lastCell.row - firstCell.row);
          
          // Calculate center points of first and last cells
          const firstCenterX = (firstCell.col + 0.5) * cellSize;
          const firstCenterY = (firstCell.row + 0.5) * cellSize;
          const lastCenterX = (lastCell.col + 0.5) * cellSize;
          const lastCenterY = (lastCell.row + 0.5) * cellSize;
          
          // Calculate the offset for the pointed ends (extend beyond cell centers)
          const offset = cellSize * 0.4; // How much to extend beyond the cell
          
          // Calculate perpendicular direction for the width of the shape
          const dx = lastCenterX - firstCenterX;
          const dy = lastCenterY - firstCenterY;
          const length = Math.sqrt(dx * dx + dy * dy);
          const perpX = -dy / length; // Perpendicular X
          const perpY = dx / length;  // Perpendicular Y
          
          const widthOffset = cellSize * 0.3; // Half width of the shape
          
          // Create polygon points: 4 points forming a diamond shape
          // Point 1: Top-left of first cell (extended)
          // Point 2: Top-right of first cell (extended)
          // Point 3: Bottom-right of last cell (extended)
          // Point 4: Bottom-left of last cell (extended)
          
          const p1x = firstCenterX - offset * (dx / length) - widthOffset * perpX;
          const p1y = firstCenterY - offset * (dy / length) - widthOffset * perpY;
          
          const p2x = firstCenterX - offset * (dx / length) + widthOffset * perpX;
          const p2y = firstCenterY - offset * (dy / length) + widthOffset * perpY;
          
          const p3x = lastCenterX + offset * (dx / length) + widthOffset * perpX;
          const p3y = lastCenterY + offset * (dy / length) + widthOffset * perpY;
          
          const p4x = lastCenterX + offset * (dx / length) - widthOffset * perpX;
          const p4y = lastCenterY + offset * (dy / length) - widthOffset * perpY;
          
          return (
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 5,
              }}
            >
              <polygon
                points={`${p1x},${p1y} ${p2x},${p2y} ${p3x},${p3y} ${p4x},${p4y}`}
                fill="none"
                stroke="#ff6b6b"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          );
        } else {
          // Horizontal or vertical: use rectangle
          let rectX: number;
          let rectY: number;
          let rectWidth: number;
          let rectHeight: number;
          
          if (isHorizontal) {
            // Horizontal line: rectangle spans only the columns of winning cells
            const minCol = Math.min(...cols);
            const maxCol = Math.max(...cols);
            rectX = minCol * cellSize;
            rectY = rows[0] * cellSize;
            rectWidth = (maxCol - minCol + 1) * cellSize;
            rectHeight = cellSize;
          } else {
            // Vertical line: rectangle spans only the rows of winning cells
            const minRow = Math.min(...rows);
            const maxRow = Math.max(...rows);
            rectX = cols[0] * cellSize;
            rectY = minRow * cellSize;
            rectWidth = cellSize;
            rectHeight = (maxRow - minRow + 1) * cellSize;
          }
          
          return (
            <Box
              sx={{
                position: 'absolute',
                left: `${rectX}px`,
                top: `${rectY}px`,
                width: `${rectWidth}px`,
                height: `${rectHeight}px`,
                border: '3px solid #ff6b6b',
                borderRadius: 2,
                pointerEvents: 'none',
                zIndex: 5,
                boxSizing: 'border-box',
              }}
            />
          );
        }
      })()}
    </Box>
  );
};

export default HistoryModal;
