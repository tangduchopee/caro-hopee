/**
 * Dealer Rotation Confirmation Modal
 * Shows when auto-rotate dealer is triggered after a match
 * Allows user to confirm or select a different dealer
 */

import React, { useState } from 'react';
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
  ListItemIcon,
  ListItemText,
  Collapse,
  Radio,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PersonIcon from '@mui/icons-material/Person';
import { useXiDachScore } from './XiDachScoreContext';
import { useLanguage } from '../../i18n';

const DealerRotationModal: React.FC = () => {
  const { t } = useLanguage();
  const {
    currentSession,
    pendingDealerRotation,
    confirmDealerRotation,
    cancelDealerRotation,
    changePendingDealer,
  } = useXiDachScore();

  const [showPlayerList, setShowPlayerList] = useState(false);

  if (!pendingDealerRotation || !currentSession) return null;

  const activePlayers = currentSession.players.filter(p => p.isActive);
  const currentDealer = activePlayers.find(p => p.id === currentSession.currentDealerId);

  const handleConfirm = () => {
    confirmDealerRotation();
    setShowPlayerList(false);
  };

  const handleCancel = () => {
    cancelDealerRotation();
    setShowPlayerList(false);
  };

  const handleSelectPlayer = (playerId: string) => {
    changePendingDealer(playerId);
  };

  return (
    <Dialog
      open={!!pendingDealerRotation}
      onClose={handleCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          fontWeight: 600,
          color: '#2c3e50',
        }}
      >
        <SwapHorizIcon sx={{ color: '#FF8A65' }} />
        {t('xiDachScore.dealerRotation.title')}
      </DialogTitle>

      <DialogContent>
        {/* Current dealer info */}
        {currentDealer && (
          <Box
            sx={{
              p: 2,
              mb: 2,
              bgcolor: '#f8f9fa',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography variant="body2" sx={{ color: '#7f8c8d' }}>
              {t('xiDachScore.dealerRotation.currentDealer')}:
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              👑 {currentDealer.name}
            </Typography>
          </Box>
        )}

        {/* New dealer suggestion */}
        <Box
          sx={{
            p: 2,
            bgcolor: 'rgba(255, 138, 101, 0.1)',
            borderRadius: 2,
            border: '2px solid #FF8A65',
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: '#7f8c8d', mb: 1 }}>
            {t('xiDachScore.dealerRotation.newDealer')}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#FF8A65' }}>
            👑 {pendingDealerRotation.suggestedDealerName}
          </Typography>
        </Box>

        {/* Toggle to show player selection */}
        <Button
          fullWidth
          variant={showPlayerList ? 'contained' : 'outlined'}
          onClick={() => setShowPlayerList(!showPlayerList)}
          sx={{
            mt: 2,
            py: 1.2,
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 500,
            ...(showPlayerList
              ? {
                  bgcolor: '#FF8A65',
                  color: '#fff',
                  '&:hover': { bgcolor: '#E64A19' },
                }
              : {
                  borderColor: '#FF8A65',
                  color: '#FF8A65',
                  '&:hover': {
                    borderColor: '#E64A19',
                    bgcolor: 'rgba(255, 138, 101, 0.08)',
                  },
                }),
          }}
        >
          {showPlayerList
            ? t('xiDachScore.dealerRotation.hidePlayerList')
            : t('xiDachScore.dealerRotation.selectOther')}
        </Button>

        {/* Player selection list */}
        <Collapse in={showPlayerList}>
          <List sx={{ mt: 1 }}>
            {activePlayers
              .filter(p => p.id !== currentSession.currentDealerId) // Exclude current dealer
              .map((player) => (
                <ListItem key={player.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleSelectPlayer(player.id)}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      bgcolor:
                        pendingDealerRotation.suggestedDealerId === player.id
                          ? 'rgba(255, 138, 101, 0.1)'
                          : 'transparent',
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Radio
                        checked={pendingDealerRotation.suggestedDealerId === player.id}
                        sx={{
                          color: '#FF8A65',
                          '&.Mui-checked': { color: '#FF8A65' },
                        }}
                      />
                    </ListItemIcon>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <PersonIcon sx={{ color: '#7f8c8d' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={player.name}
                      primaryTypographyProps={{
                        fontWeight:
                          pendingDealerRotation.suggestedDealerId === player.id ? 600 : 400,
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
          </List>
        </Collapse>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          onClick={handleConfirm}
          sx={{
            bgcolor: '#FF8A65',
            '&:hover': { bgcolor: '#E64A19' },
          }}
        >
          {t('xiDachScore.dealerRotation.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DealerRotationModal;
