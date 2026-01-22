/**
 * LogoutConfirmationDialog - Dialog for confirming logout action
 */
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { useLanguage } from '../../i18n';

interface LogoutConfirmationDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const LogoutConfirmationDialog: React.FC<LogoutConfirmationDialogProps> = ({
  open,
  onConfirm,
  onCancel,
}) => {
  const { t } = useLanguage();

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '2px solid transparent',
          backgroundImage:
            'linear-gradient(#ffffff, #ffffff), linear-gradient(135deg, #ffaaa5 0%, #ff6b6b 100%)',
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          pt: 3,
          pb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: '#2c3e50',
          }}
        >
          {t('auth.logoutConfirmTitle') || 'Đăng xuất?'}
        </Typography>
      </DialogTitle>
      <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
        <Typography variant="body1" sx={{ color: '#5a6a7a', mb: 1 }}>
          {t('auth.logoutConfirmMessage') || 'Bạn có chắc chắn muốn đăng xuất?'}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1.5, justifyContent: 'space-between' }}>
        <Button
          onClick={onCancel}
          variant="outlined"
          sx={{
            borderColor: 'rgba(255, 170, 165, 0.5)',
            color: '#ffaaa5',
            '&:hover': {
              borderColor: 'rgba(255, 170, 165, 0.8)',
              background: 'rgba(255, 170, 165, 0.1)',
            },
          }}
        >
          {t('common.cancel')}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #ffaaa5 0%, #ff6b6b 100%)',
            color: '#fff',
            '&:hover': {
              background: 'linear-gradient(135deg, #ff8a80 0%, #ff5252 100%)',
            },
          }}
        >
          {t('auth.logout')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LogoutConfirmationDialog;

