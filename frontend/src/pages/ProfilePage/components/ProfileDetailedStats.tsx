/**
 * ProfileDetailedStats - Displays detailed game statistics
 * Includes streaks, board size breakdown, play time, and recent form
 */
import React from 'react';
import { Box, Typography, Tooltip, Chip } from '@mui/material';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GridOnIcon from '@mui/icons-material/GridOn';
import { useLanguage } from '../../../i18n';

interface Streaks {
  currentWin: number;
  currentLoss: number;
  bestWin: number;
  bestLoss: number;
}

interface BoardSizeStats {
  wins: number;
  losses: number;
  draws: number;
}

interface ProfileDetailedStatsProps {
  streaks: Streaks;
  byBoardSize: Record<string, BoardSizeStats>;
  totalPlayTime: number;
  avgGameDuration: number;
  lastTenGames: ('W' | 'L' | 'D')[];
}

const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const ProfileDetailedStats: React.FC<ProfileDetailedStatsProps> = ({
  streaks,
  byBoardSize,
  totalPlayTime,
  avgGameDuration,
  lastTenGames,
}) => {
  const { t } = useLanguage();

  const hasStreakData = streaks.bestWin > 0 || streaks.bestLoss > 0;
  const hasBoardSizeData = Object.keys(byBoardSize).length > 0;
  const hasPlayTimeData = totalPlayTime > 0;
  const hasRecentGames = lastTenGames.length > 0;

  if (!hasStreakData && !hasBoardSizeData && !hasPlayTimeData && !hasRecentGames) {
    return null;
  }

  return (
    <Box sx={{ mt: 3 }}>
      {/* Streaks Section */}
      {hasStreakData && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle1"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: '#2c3e50',
              fontWeight: 600,
              mb: 1.5,
            }}
          >
            <WhatshotIcon sx={{ color: '#ff6b6b', fontSize: 20 }} />
            {t('profile.streaks')}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr 1fr' },
              gap: 1.5,
            }}
          >
            <Tooltip title={t('profile.currentWinStreak')}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(168, 230, 207, 0.15)',
                  border: '1px solid rgba(168, 230, 207, 0.3)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" sx={{ color: '#5a6a7a', display: 'block' }}>
                  {t('profile.currentWin')}
                </Typography>
                <Typography variant="h6" sx={{ color: '#a8e6cf', fontWeight: 700 }}>
                  {streaks.currentWin}
                </Typography>
              </Box>
            </Tooltip>
            <Tooltip title={t('profile.bestWinStreak')}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(126, 200, 227, 0.15)',
                  border: '1px solid rgba(126, 200, 227, 0.3)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" sx={{ color: '#5a6a7a', display: 'block' }}>
                  {t('profile.bestWin')}
                </Typography>
                <Typography variant="h6" sx={{ color: '#7ec8e3', fontWeight: 700 }}>
                  {streaks.bestWin}
                </Typography>
              </Box>
            </Tooltip>
            <Tooltip title={t('profile.currentLossStreak')}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 170, 165, 0.15)',
                  border: '1px solid rgba(255, 170, 165, 0.3)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" sx={{ color: '#5a6a7a', display: 'block' }}>
                  {t('profile.currentLoss')}
                </Typography>
                <Typography variant="h6" sx={{ color: '#ffaaa5', fontWeight: 700 }}>
                  {streaks.currentLoss}
                </Typography>
              </Box>
            </Tooltip>
            <Tooltip title={t('profile.bestLossStreak')}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(255, 184, 140, 0.15)',
                  border: '1px solid rgba(255, 184, 140, 0.3)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" sx={{ color: '#5a6a7a', display: 'block' }}>
                  {t('profile.worstLoss')}
                </Typography>
                <Typography variant="h6" sx={{ color: '#ffb88c', fontWeight: 700 }}>
                  {streaks.bestLoss}
                </Typography>
              </Box>
            </Tooltip>
          </Box>
        </Box>
      )}

      {/* Recent Form (Last 10 Games) */}
      {hasRecentGames && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle1"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: '#2c3e50',
              fontWeight: 600,
              mb: 1.5,
            }}
          >
            <TrendingUpIcon sx={{ color: '#7ec8e3', fontSize: 20 }} />
            {t('profile.recentForm')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {lastTenGames.map((result, index) => (
              <Chip
                key={index}
                label={result}
                size="small"
                sx={{
                  minWidth: 32,
                  height: 28,
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  bgcolor:
                    result === 'W'
                      ? 'rgba(168, 230, 207, 0.3)'
                      : result === 'L'
                        ? 'rgba(255, 170, 165, 0.3)'
                        : 'rgba(255, 184, 140, 0.3)',
                  color:
                    result === 'W' ? '#2e7d32' : result === 'L' ? '#c62828' : '#ef6c00',
                  border: `1px solid ${
                    result === 'W'
                      ? 'rgba(168, 230, 207, 0.6)'
                      : result === 'L'
                        ? 'rgba(255, 170, 165, 0.6)'
                        : 'rgba(255, 184, 140, 0.6)'
                  }`,
                }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Play Time Stats */}
      {hasPlayTimeData && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle1"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: '#2c3e50',
              fontWeight: 600,
              mb: 1.5,
            }}
          >
            <AccessTimeIcon sx={{ color: '#9c88ff', fontSize: 20 }} />
            {t('profile.playTime')}
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(156, 136, 255, 0.1)',
                border: '1px solid rgba(156, 136, 255, 0.3)',
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" sx={{ color: '#5a6a7a', display: 'block' }}>
                {t('profile.totalPlayTime')}
              </Typography>
              <Typography variant="h6" sx={{ color: '#9c88ff', fontWeight: 700 }}>
                {formatTime(totalPlayTime)}
              </Typography>
            </Box>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(156, 136, 255, 0.1)',
                border: '1px solid rgba(156, 136, 255, 0.3)',
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" sx={{ color: '#5a6a7a', display: 'block' }}>
                {t('profile.avgGameDuration')}
              </Typography>
              <Typography variant="h6" sx={{ color: '#9c88ff', fontWeight: 700 }}>
                {formatTime(avgGameDuration)}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* Board Size Breakdown */}
      {hasBoardSizeData && (
        <Box>
          <Typography
            variant="subtitle1"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: '#2c3e50',
              fontWeight: 600,
              mb: 1.5,
            }}
          >
            <GridOnIcon sx={{ color: '#00b894', fontSize: 20 }} />
            {t('profile.byBoardSize')}
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {Object.entries(byBoardSize).map(([size, stats]) => {
              const total = stats.wins + stats.losses + stats.draws;
              const winRate = total > 0 ? Math.round((stats.wins / total) * 100) : 0;
              return (
                <Box
                  key={size}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: 'rgba(0, 184, 148, 0.08)',
                    border: '1px solid rgba(0, 184, 148, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip
                      label={size}
                      size="small"
                      sx={{
                        bgcolor: '#00b894',
                        color: '#fff',
                        fontWeight: 600,
                      }}
                    />
                    <Typography variant="body2" sx={{ color: '#5a6a7a' }}>
                      {total} {t('profile.gamesPlayed')}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" sx={{ color: '#a8e6cf', fontWeight: 600 }}>
                      W: {stats.wins}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ffaaa5', fontWeight: 600 }}>
                      L: {stats.losses}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#ffb88c', fontWeight: 600 }}>
                      D: {stats.draws}
                    </Typography>
                    <Chip
                      label={`${winRate}%`}
                      size="small"
                      sx={{
                        bgcolor: winRate >= 50 ? 'rgba(168, 230, 207, 0.3)' : 'rgba(255, 170, 165, 0.3)',
                        color: winRate >= 50 ? '#2e7d32' : '#c62828',
                        fontWeight: 600,
                        minWidth: 50,
                      }}
                    />
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default ProfileDetailedStats;
