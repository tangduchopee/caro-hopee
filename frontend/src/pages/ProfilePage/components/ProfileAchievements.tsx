/**
 * ProfileAchievements - Displays user achievements with locked/unlocked states
 */
import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Chip,
  CircularProgress,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useLanguage } from '../../../i18n';
import { userApi } from '../../../services/api';
import {
  AchievementDefinition,
  UnlockedAchievement,
  AchievementCategory,
  RARITY_COLORS,
  RARITY_BG_COLORS,
  RARITY_NAMES,
  CATEGORY_NAMES,
} from '../../../constants/achievements';
import { logger } from '../../../utils/logger';

interface AchievementsData {
  unlocked: UnlockedAchievement[];
  locked: AchievementDefinition[];
  total: number;
  unlockedCount: number;
}

const ProfileAchievements: React.FC = () => {
  const { t, language } = useLanguage();
  const [data, setData] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');

  const loadAchievements = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userApi.getMyAchievements('caro');
      setData(response);
    } catch (error) {
      logger.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const handleCategoryChange = (_event: React.SyntheticEvent, newValue: AchievementCategory | 'all') => {
    setSelectedCategory(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress sx={{ color: '#7ec8e3' }} />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography sx={{ color: '#5a6a7a' }}>{t('profile.noAchievements')}</Typography>
      </Box>
    );
  }

  const filterByCategory = (achievements: (AchievementDefinition | UnlockedAchievement)[]) => {
    if (selectedCategory === 'all') return achievements;
    return achievements.filter((a) => a.category === selectedCategory);
  };

  const filteredUnlocked = filterByCategory(data.unlocked) as UnlockedAchievement[];
  const filteredLocked = filterByCategory(data.locked);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Box>
      {/* Progress Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography variant="h5" sx={{ color: '#2c3e50', fontWeight: 700 }}>
          {t('profile.achievements')}
        </Typography>
        <Chip
          label={`${data.unlockedCount} / ${data.total}`}
          sx={{
            bgcolor: 'rgba(126, 200, 227, 0.15)',
            color: '#7ec8e3',
            fontWeight: 700,
            fontSize: '0.95rem',
            px: 1,
          }}
        />
      </Box>

      {/* Category Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={selectedCategory}
          onChange={handleCategoryChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.9rem',
              minWidth: 'auto',
              px: 2,
            },
            '& .Mui-selected': {
              color: '#7ec8e3',
            },
          }}
        >
          <Tab value="all" label={language === 'vi' ? 'Tất cả' : 'All'} />
          {(['wins', 'streaks', 'games', 'score', 'special'] as AchievementCategory[]).map((cat) => (
            <Tab key={cat} value={cat} label={CATEGORY_NAMES[cat][language]} />
          ))}
        </Tabs>
      </Box>

      {/* Unlocked Achievements */}
      {filteredUnlocked.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="subtitle1"
            sx={{ color: '#2c3e50', fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <span>🏆</span> {t('profile.unlockedAchievements')} ({filteredUnlocked.length})
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            {filteredUnlocked.map((achievement) => (
              <Tooltip
                key={achievement.id}
                title={`${t('profile.unlockedOn')}: ${formatDate(achievement.unlockedAt)}`}
                arrow
                placement="top"
              >
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: RARITY_BG_COLORS[achievement.rarity],
                    border: `2px solid ${RARITY_COLORS[achievement.rarity]}`,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 20px ${RARITY_COLORS[achievement.rarity]}40`,
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Typography sx={{ fontSize: '2rem', lineHeight: 1 }}>{achievement.icon}</Typography>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          color: '#2c3e50',
                          fontSize: '0.95rem',
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {achievement.name[language]}
                      </Typography>
                      <Typography
                        sx={{
                          color: '#5a6a7a',
                          fontSize: '0.8rem',
                          lineHeight: 1.3,
                        }}
                      >
                        {achievement.desc[language]}
                      </Typography>
                      <Chip
                        label={RARITY_NAMES[achievement.rarity][language]}
                        size="small"
                        sx={{
                          mt: 1,
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          bgcolor: `${RARITY_COLORS[achievement.rarity]}20`,
                          color: RARITY_COLORS[achievement.rarity],
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Tooltip>
            ))}
          </Box>
        </Box>
      )}

      {/* Locked Achievements */}
      {filteredLocked.length > 0 && (
        <Box>
          <Typography
            variant="subtitle1"
            sx={{ color: '#5a6a7a', fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <LockIcon sx={{ fontSize: 18 }} /> {t('profile.lockedAchievements')} ({filteredLocked.length})
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 2,
            }}
          >
            {filteredLocked.map((achievement) => (
              <Tooltip key={achievement.id} title={achievement.desc[language]} arrow placement="top">
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    bgcolor: 'rgba(156, 163, 175, 0.05)',
                    border: '2px solid rgba(156, 163, 175, 0.2)',
                    opacity: 0.6,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Typography
                      sx={{
                        fontSize: '2rem',
                        lineHeight: 1,
                        filter: 'grayscale(1)',
                        opacity: 0.5,
                      }}
                    >
                      {achievement.icon}
                    </Typography>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: '#9CA3AF',
                          fontSize: '0.95rem',
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {achievement.name[language]}
                      </Typography>
                      <Typography
                        sx={{
                          color: '#9CA3AF',
                          fontSize: '0.8rem',
                          lineHeight: 1.3,
                        }}
                      >
                        {achievement.desc[language]}
                      </Typography>
                      <Chip
                        label={RARITY_NAMES[achievement.rarity][language]}
                        size="small"
                        sx={{
                          mt: 1,
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          bgcolor: 'rgba(156, 163, 175, 0.1)',
                          color: '#9CA3AF',
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Tooltip>
            ))}
          </Box>
        </Box>
      )}

      {/* No achievements in category */}
      {filteredUnlocked.length === 0 && filteredLocked.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography sx={{ color: '#5a6a7a' }}>{t('profile.noAchievementsInCategory')}</Typography>
        </Box>
      )}
    </Box>
  );
};

export default ProfileAchievements;
