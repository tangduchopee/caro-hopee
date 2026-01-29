/**
 * Blackjack Score Tracker - Add Player Modal
 * Form to add a new player to the session
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  InputAdornment,
} from '@mui/material';
import { useLanguage } from '../../i18n';

interface AddPlayerModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, baseScore: number) => void;
  existingNames: string[];
}

const AddPlayerModal: React.FC<AddPlayerModalProps> = ({
  open,
  onClose,
  onAdd,
  existingNames,
}) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [baseScore, setBaseScore] = useState(0);
  const [error, setError] = useState('');

  const handleClose = () => {
    setName('');
    setBaseScore(0);
    setError('');
    onClose();
  };

  const handleAdd = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError(t('xiDachScore.player.nameRequired'));
      return;
    }

    if (existingNames.some(n => n.toLowerCase() === trimmedName.toLowerCase())) {
      setError(t('xiDachScore.player.nameExists'));
      return;
    }

    onAdd(trimmedName, baseScore);
    handleClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{
        sx: { borderRadius: 3, minWidth: 320 },
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
        {t('xiDachScore.player.add')}
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <TextField
          autoFocus
          fullWidth
          label={t('xiDachScore.player.name')}
          placeholder={t('xiDachScore.player.namePlaceholder')}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          onKeyPress={handleKeyPress}
          error={!!error}
          helperText={error}
          sx={{ mb: 2, mt: 1 }}
          InputProps={{
            sx: { borderRadius: 2 },
          }}
        />

        <TextField
          fullWidth
          label={t('xiDachScore.player.baseScore')}
          type="number"
          value={baseScore === 0 ? '' : baseScore}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '' || val === '-') {
              setBaseScore(0);
            } else {
              setBaseScore(parseInt(val) || 0);
            }
          }}
          onKeyPress={handleKeyPress}
          InputProps={{
            endAdornment: <InputAdornment position="end">đ</InputAdornment>,
            sx: { borderRadius: 2 },
          }}
          helperText={t('xiDachScore.player.baseScoreHelper')}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="outlined"
          onClick={handleClose}
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
          {t('xiDachScore.actions.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleAdd}
          sx={{
            bgcolor: '#FF8A65',
            '&:hover': { bgcolor: '#E64A19' },
          }}
        >
          {t('xiDachScore.actions.add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddPlayerModal;
