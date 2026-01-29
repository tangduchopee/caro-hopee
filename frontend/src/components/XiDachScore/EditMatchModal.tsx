/**
 * Xì Dách Score Tracker - Edit Match Modal
 * Modal to edit the last match results (pre-filled with existing data)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Snackbar,
  Chip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useXiDachScore } from './XiDachScoreContext';
import PlayerResultInput, { PlayerResultInputData } from './PlayerResultInput';
import { createPlayerResult } from '../../utils/xi-dach-score-storage';
import { useLanguage } from '../../i18n';

interface EditMatchModalProps {
  open: boolean;
  matchId: string | null;
  onClose: () => void;
}

const EditMatchModal: React.FC<EditMatchModalProps> = ({ open, matchId, onClose }) => {
  const { t } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentSession, editMatch } = useXiDachScore();

  const [playerResults, setPlayerResults] = useState<
    Record<string, PlayerResultInputData>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Get the match to edit
  const matchToEdit = useMemo(() => {
    if (!currentSession || !matchId) return null;
    return currentSession.matches.find((m) => m.id === matchId) || null;
  }, [currentSession, matchId]);

  // Get active players
  const activePlayers = useMemo(
    () => currentSession?.players.filter((p) => p.isActive) || [],
    [currentSession?.players]
  );

  const dealer = useMemo(
    () => activePlayers.find((p) => p.id === matchToEdit?.dealerId),
    [activePlayers, matchToEdit?.dealerId]
  );

  // Initialize player results when modal opens with existing match data
  useEffect(() => {
    if (open && matchToEdit && currentSession) {
      const initialResults: Record<string, PlayerResultInputData> = {};

      // Pre-fill with existing match results
      matchToEdit.results.forEach((result) => {
        initialResults[result.playerId] = {
          playerId: result.playerId,
          outcome: result.outcome,
          tuCount: result.tuCount,
          xiBanCount: result.xiBanCount,
          nguLinhCount: result.nguLinhCount,
          penalty28: result.penalty28,
          penalty28Recipients: result.penalty28Recipients,
        };
      });

      // Add any players who weren't in the original match (unlikely but safe)
      activePlayers.forEach((player) => {
        if (!initialResults[player.id]) {
          initialResults[player.id] = {
            playerId: player.id,
            outcome: null,
            tuCount: 1,
            xiBanCount: 0,
            nguLinhCount: 0,
            penalty28: false,
            penalty28Recipients: [],
          };
        }
      });

      setPlayerResults(initialResults);
      setError(null);
    }
  }, [open, matchToEdit, currentSession, activePlayers]);

  const handlePlayerResultChange = (data: PlayerResultInputData) => {
    setPlayerResults((prev) => ({
      ...prev,
      [data.playerId]: data,
    }));
    setError(null);
  };

  const validateResults = (): string | null => {
    for (const player of activePlayers) {
      const result = playerResults[player.id];
      if (!result) {
        return t('xiDachScore.match.missingResult', { name: player.name });
      }
      if (!result.outcome) {
        return t('xiDachScore.match.noOutcome', { name: player.name });
      }
      if (result.tuCount < 1) {
        return t('xiDachScore.match.tuMin', { name: player.name });
      }
      if (result.penalty28 && result.penalty28Recipients.length === 0) {
        return t('xiDachScore.match.penalty28NoRecipient', { name: player.name });
      }
    }
    return null;
  };

  const handleSubmit = () => {
    const validationError = validateResults();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!currentSession || !matchId) return;

    // Create player results with calculated scores
    const results = activePlayers.map((player) => {
      const data = playerResults[player.id];
      return createPlayerResult(
        player.id,
        {
          tuCount: data.tuCount,
          outcome: data.outcome as 'win' | 'lose',
          xiBanCount: data.xiBanCount,
          nguLinhCount: data.nguLinhCount,
          penalty28: data.penalty28,
          penalty28Recipients: data.penalty28Recipients,
        },
        currentSession.settings
      );
    });

    // Edit match
    editMatch(matchId, results);
    setShowSuccess(true);

    // Close modal after short delay
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 500);
  };

  if (!currentSession || !matchToEdit) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            maxHeight: isMobile ? '100%' : '90vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 600,
            borderBottom: '1px solid #eee',
            pb: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#2c3e50' }}>
              {t('xiDachScore.history.editTitle', { number: matchToEdit.matchNumber })}
            </Typography>
            <Chip
              label={t('xiDachScore.history.editing')}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.65rem',
                bgcolor: '#FFB74D',
                color: '#fff',
              }}
            />
          </Box>
          {dealer && (
            <Typography variant="body2" sx={{ color: '#7f8c8d', mt: 0.5 }}>
              {t('xiDachScore.dealer.label')}: 👑 {dealer.name}
            </Typography>
          )}
        </DialogTitle>

        <DialogContent
          sx={{
            p: 2,
            bgcolor: '#f8f9fa',
          }}
        >
          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Settings Info */}
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              bgcolor: '#fff',
              borderRadius: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="caption" sx={{ color: '#95a5a6' }}>
              {currentSession.settings.pointsPerTu}{t('xiDachScore.game.perTu')}
            </Typography>
            <Typography variant="caption" sx={{ color: '#95a5a6' }}>
              {t('xiDachScore.penalty28Short')}: {currentSession.settings.penalty28Amount}đ
            </Typography>
          </Box>

          {/* Player Results */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {activePlayers.map((player) => {
              const otherPlayers = activePlayers.filter(
                (p) => p.id !== player.id
              );
              return (
                <PlayerResultInput
                  key={player.id}
                  player={player}
                  data={
                    playerResults[player.id] || {
                      playerId: player.id,
                      outcome: null,
                      tuCount: 1,
                      xiBanCount: 0,
                      nguLinhCount: 0,
                      penalty28: false,
                      penalty28Recipients: [],
                    }
                  }
                  settings={currentSession.settings}
                  otherPlayers={otherPlayers}
                  onChange={handlePlayerResultChange}
                  isDealer={player.id === matchToEdit.dealerId}
                />
              );
            })}
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: '1px solid #eee',
            bgcolor: '#fff',
          }}
        >
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              borderColor: '#FF8A65',
              color: '#FF8A65',
              bgcolor: '#fff',
              px: 3,
              '&:hover': {
                borderColor: '#E64A19',
                bgcolor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            {t('xiDachScore.actions.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              px: 4,
              bgcolor: '#FF8A65',
              '&:hover': { bgcolor: '#E64A19' },
            }}
          >
            {t('xiDachScore.history.saveChanges')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={2000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ borderRadius: 2 }}>
          {t('xiDachScore.history.updated', { number: matchToEdit.matchNumber })}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EditMatchModal;
