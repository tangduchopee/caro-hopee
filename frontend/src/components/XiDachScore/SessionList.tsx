/**
 * Blackjack Score Tracker - Session List
 * Displays all sessions with ability to open, create, or delete
 */

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { useXiDachScore } from './XiDachScoreContext';
import { XiDachSession, XiDachSessionStatus } from '../../types/xi-dach-score.types';
import { useLanguage } from '../../i18n';

// ============== HELPERS ==============

const getStatusLabel = (status: XiDachSessionStatus, t: (key: string) => string): string => {
  switch (status) {
    case 'setup':
      return t('xiDachScore.status.setup');
    case 'playing':
      return t('xiDachScore.status.playing');
    case 'paused':
      return t('xiDachScore.status.paused');
    case 'ended':
      return t('xiDachScore.status.ended');
    default:
      return status;
  }
};

const getStatusColor = (status: XiDachSessionStatus): string => {
  switch (status) {
    case 'setup':
      return '#FF8A65';
    case 'playing':
      return '#2e7d32'; // xanh lá - đang chơi
    case 'paused':
      return '#FFB74D';
    case 'ended':
      return '#95a5a6';
    default:
      return '#95a5a6';
  }
};

const formatDate = (isoString: string, t: (key: string, params?: Record<string, string | number>) => string, locale: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return t('xiDachScore.time.justNow');
  if (minutes < 60) return t('xiDachScore.time.minutesAgo', { count: minutes });
  if (hours < 24) return t('xiDachScore.time.hoursAgo', { count: hours });
  if (days < 7) return t('xiDachScore.time.daysAgo', { count: days });

  return date.toLocaleDateString(locale === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// ============== SESSION CARD ==============

interface SessionCardProps {
  session: XiDachSession;
  onSelect: () => void;
  onDelete: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  locale: string;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onSelect, onDelete, t, locale }) => {
  const activePlayers = session.players.filter((p) => p.isActive).length;
  const matchCount = session.matches.length;

  return (
    <Card
      sx={{
        mb: 2,
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(255, 138, 101, 0.15)',
        border: '1px solid rgba(255, 138, 101, 0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 16px rgba(255, 138, 101, 0.2)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
        <CardActionArea onClick={onSelect} sx={{ flex: 1 }}>
          <CardContent sx={{ py: 2, px: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: '#2c3e50',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {session.name}
              </Typography>
              <Chip
                label={getStatusLabel(session.status, t)}
                size="small"
                sx={{
                  bgcolor: getStatusColor(session.status),
                  color: '#fff',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  height: 24,
                }}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                color: '#7f8c8d',
                fontSize: '0.875rem',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PeopleIcon sx={{ fontSize: 18 }} />
                <span>{activePlayers} {t('xiDachScore.players')}</span>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <SportsEsportsIcon sx={{ fontSize: 18 }} />
                <span>#{matchCount}</span>
              </Box>
              <Typography variant="caption" sx={{ ml: 'auto', color: '#95a5a6' }}>
                {formatDate(session.updatedAt, t, locale)}
              </Typography>
            </Box>
          </CardContent>
        </CardActionArea>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 1,
            borderLeft: '1px solid rgba(255, 138, 101, 0.1)',
          }}
        >
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            sx={{
              color: '#FF8A65',
              '&:hover': {
                bgcolor: 'rgba(255, 138, 101, 0.1)',
              },
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>
    </Card>
  );
};

// ============== MAIN COMPONENT ==============

const SessionList: React.FC = () => {
  const { t, language } = useLanguage();
  const { sessions, goToSetup, goToPlaying, deleteSession } = useXiDachScore();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Handle session selection - ended sessions go to summary view
  const handleSelectSession = (session: XiDachSession) => {
    // goToPlaying handles the routing - if session is ended, it will show summary
    goToPlaying(session.id);
  };

  // Sort sessions: playing/paused first, then by updatedAt
  const sortedSessions = [...sessions].sort((a, b) => {
    const statusOrder = { playing: 0, paused: 1, setup: 2, ended: 3 };
    const statusDiff = statusOrder[a.status] - statusOrder[b.status];
    if (statusDiff !== 0) return statusDiff;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const handleDelete = () => {
    if (deleteConfirm) {
      deleteSession(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const sessionToDelete = deleteConfirm
    ? sessions.find((s) => s.id === deleteConfirm)
    : null;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#FFF8F5',
        pt: { xs: 10, md: 4 },
        pb: 4,
        px: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#FF8A65',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
            }}
          >
            <span>🎴</span> {t('xiDachScore.title')}
          </Typography>
          <Typography variant="body2" sx={{ color: '#7f8c8d', mt: 0.5 }}>
            {t('xiDachScore.subtitle')}
          </Typography>
        </Box>

        {/* Session List */}
        {sortedSessions.length > 0 ? (
          <Box sx={{ mb: 3 }}>
            {sortedSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onSelect={() => handleSelectSession(session)}
                onDelete={() => setDeleteConfirm(session.id)}
                t={t}
                locale={language}
              />
            ))}
          </Box>
        ) : (
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              color: '#95a5a6',
            }}
          >
            <Typography variant="body1" sx={{ mb: 1 }}>
              {t('xiDachScore.noSessions')}
            </Typography>
            <Typography variant="body2">
              {t('xiDachScore.noSessionsHint')}
            </Typography>
          </Box>
        )}

        {/* Create Button - Tạo bàn mới: màu chủ đạo route xi-dach-score */}
        <Button
          variant="contained"
          fullWidth
          startIcon={<AddIcon />}
          onClick={goToSetup}
          sx={{
            py: 1.5,
            borderRadius: 3,
            background: '#FF8A65',
            color: '#fff',
            fontWeight: 600,
            fontSize: '1rem',
            boxShadow: '0 4px 12px rgba(255, 138, 101, 0.3)',
            '&:hover': {
              background: '#E64A19',
              boxShadow: '0 6px 16px rgba(255, 138, 101, 0.4)',
            },
          }}
        >
          {t('xiDachScore.createSession')}
        </Button>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>{t('xiDachScore.deleteSession')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('xiDachScore.deleteSessionConfirm', { name: sessionToDelete?.name || '' })}
            <br />
            {t('xiDachScore.deleteSessionWarning')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setDeleteConfirm(null)}
            sx={{
              borderColor: '#FF8A65',
              color: '#FF8A65',
              background: '#fff',
              '&:hover': {
                borderColor: '#E64A19',
                background: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            {t('xiDachScore.actions.cancel')}
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            sx={{
              background: '#FF8A65',
              color: '#fff',
              '&:hover': { background: '#E64A19' },
            }}
          >
            {t('xiDachScore.actions.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SessionList;
