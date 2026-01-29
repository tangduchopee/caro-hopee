/**
 * Blackjack Score Tracker - Change Dealer Modal
 * Select a new dealer from active players
 */

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Typography,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import { XiDachPlayer } from '../../types/xi-dach-score.types';
import { useLanguage } from '../../i18n';

interface ChangeDealerModalProps {
  open: boolean;
  players: XiDachPlayer[];
  currentDealerId: string | null;
  onClose: () => void;
  onSelect: (playerId: string) => void;
}

const ChangeDealerModal: React.FC<ChangeDealerModalProps> = ({
  open,
  players,
  currentDealerId,
  onClose,
  onSelect,
}) => {
  const { t } = useLanguage();
  const activePlayers = players.filter((p) => p.isActive);

  const handleSelect = (playerId: string) => {
    onSelect(playerId);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { borderRadius: 3, minWidth: 320 },
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
        {t('xiDachScore.dealer.changeTitle')}
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {activePlayers.length === 0 ? (
          <Typography
            variant="body2"
            sx={{ p: 3, textAlign: 'center', color: '#95a5a6' }}
          >
            {t('xiDachScore.dealer.noPlayers')}
          </Typography>
        ) : (
          <List sx={{ py: 1 }}>
            {activePlayers.map((player) => {
              const isCurrentDealer = player.id === currentDealerId;
              return (
                <ListItemButton
                  key={player.id}
                  onClick={() => handleSelect(player.id)}
                  selected={isCurrentDealer}
                  sx={{
                    py: 1.5,
                    '&.Mui-selected': {
                      bgcolor: 'rgba(255, 138, 101, 0.1)',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.04)',
                      },
                    },
                    '&:hover': {
                      bgcolor: 'rgba(255, 138, 101, 0.05)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {isCurrentDealer ? (
                      <span style={{ fontSize: '1.2rem' }}>👑</span>
                    ) : (
                      <PersonIcon sx={{ color: '#95a5a6' }} />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={player.name}
                    secondary={isCurrentDealer ? t('xiDachScore.dealer.current') : null}
                    primaryTypographyProps={{
                      fontWeight: isCurrentDealer ? 600 : 400,
                      color: isCurrentDealer ? '#FF8A65' : '#2c3e50',
                    }}
                    secondaryTypographyProps={{
                      sx: { color: '#FF8A65', fontSize: '0.75rem' },
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{
            borderColor: '#FF8A65',
            color: '#FF8A65',
            bgcolor: '#fff',
            '&:hover': {
              borderColor: '#E64A19',
              bgcolor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
        >
          {t('xiDachScore.actions.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangeDealerModal;
