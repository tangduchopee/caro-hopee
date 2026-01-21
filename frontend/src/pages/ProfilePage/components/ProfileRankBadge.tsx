/**
 * ProfileRankBadge - Displays user rank with progress bar to next rank
 */
import React from 'react';
import { Box, Typography, LinearProgress, Tooltip } from '@mui/material';
import { getRank, getNextRank, getRankProgress, getPointsToNextRank } from '../../../utils/rank';
import { useLanguage } from '../../../i18n';

interface ProfileRankBadgeProps {
  totalScore: number;
  compact?: boolean;
}

const ProfileRankBadge: React.FC<ProfileRankBadgeProps> = ({
  totalScore,
  compact = false,
}) => {
  const { language, t } = useLanguage();

  const rank = getRank(totalScore);
  const nextRank = getNextRank(rank);
  const progress = getRankProgress(totalScore);
  const pointsNeeded = getPointsToNextRank(totalScore);

  const rankName = rank.name[language];
  const nextRankName = nextRank?.name[language];

  if (compact) {
    return (
      <Tooltip title={`${rankName} - ${totalScore} ${t('profile.points')}`}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1.5,
            py: 0.5,
            borderRadius: 2,
            bgcolor: `${rank.color}20`,
            border: `1px solid ${rank.color}40`,
          }}
        >
          <Typography fontSize="1.2rem">{rank.icon}</Typography>
          <Typography
            fontSize="0.85rem"
            fontWeight={600}
            sx={{ color: rank.color }}
          >
            {rankName}
          </Typography>
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 3,
        background: `linear-gradient(135deg, ${rank.color}15 0%, ${rank.color}05 100%)`,
        border: `2px solid ${rank.color}30`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background icon */}
      <Box
        sx={{
          position: 'absolute',
          right: -10,
          top: -10,
          fontSize: '5rem',
          opacity: 0.1,
          transform: 'rotate(15deg)',
        }}
      >
        {rank.icon}
      </Box>

      {/* Rank Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, position: 'relative' }}>
        <Typography fontSize="2.5rem">{rank.icon}</Typography>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: rank.color,
              textShadow: `0 0 20px ${rank.color}40`,
            }}
          >
            {rankName}
          </Typography>
          <Typography variant="body2" sx={{ color: '#5a6a7a' }}>
            {t('profile.rank')}
          </Typography>
        </Box>
      </Box>

      {/* Score Display */}
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#2c3e50',
            display: 'flex',
            alignItems: 'baseline',
            gap: 0.5,
          }}
        >
          {totalScore.toLocaleString()}
          <Typography
            component="span"
            variant="body2"
            sx={{ color: '#8a9ba8', fontWeight: 500 }}
          >
            {t('profile.points')}
          </Typography>
        </Typography>
      </Box>

      {/* Progress to next rank */}
      {nextRank ? (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#5a6a7a' }}>
              {t('profile.progressToNextRank')}
            </Typography>
            <Typography variant="caption" sx={{ color: '#5a6a7a', fontWeight: 600 }}>
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'rgba(126, 200, 227, 0.2)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: `linear-gradient(90deg, ${rank.color} 0%, ${nextRank.color} 100%)`,
              },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" sx={{ color: rank.color, fontWeight: 600 }}>
              {rank.icon} {rankName}
            </Typography>
            <Typography variant="caption" sx={{ color: nextRank.color, fontWeight: 600 }}>
              {nextRank.icon} {nextRankName}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{ color: '#5a6a7a', mt: 1.5, textAlign: 'center' }}
          >
            {t('profile.pointsToNextRank', { points: pointsNeeded?.toLocaleString() || 0 })}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center', py: 1 }}>
          <Typography
            variant="body2"
            sx={{
              color: rank.color,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
            }}
          >
            🎉 {t('profile.maxRankReached')}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ProfileRankBadge;
