/**
 * AchievementContext - Manages achievement notifications and state
 */
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Snackbar, Box, Typography, Slide, Paper } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { useLanguage } from '../i18n';
import { AchievementDefinition, RARITY_COLORS } from '../constants/achievements';

interface AchievementContextType {
  showAchievementToast: (achievement: AchievementDefinition) => void;
  showMultipleAchievements: (achievements: AchievementDefinition[]) => void;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

function SlideTransition(props: TransitionProps & { children: React.ReactElement }) {
  return <Slide {...props} direction="up" />;
}

interface AchievementQueueItem {
  id: string;
  achievement: AchievementDefinition;
}

export const AchievementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const [queue, setQueue] = useState<AchievementQueueItem[]>([]);
  const [current, setCurrent] = useState<AchievementQueueItem | null>(null);
  const [open, setOpen] = useState(false);

  const showAchievementToast = useCallback((achievement: AchievementDefinition) => {
    const id = `${achievement.id}-${Date.now()}`;
    setQueue((prev) => [...prev.slice(0, 2), { id, achievement }]); // Max 3 in queue
  }, []);

  const showMultipleAchievements = useCallback((achievements: AchievementDefinition[]) => {
    const items = achievements.map((a) => ({
      id: `${a.id}-${Date.now()}`,
      achievement: a,
    }));
    setQueue((prev) => [...prev.slice(0, 2), ...items.slice(0, 3)]); // Max 3 new items
  }, []);

  // FIX C1: Use functional state updates to avoid infinite loop
  // processQueue now has stable reference (empty deps) and uses functional updates
  const processQueue = useCallback(() => {
    setQueue((prevQueue) => {
      if (prevQueue.length > 0) {
        setCurrent((prevCurrent) => {
          if (!prevCurrent) {
            setOpen(true);
            return prevQueue[0];
          }
          return prevCurrent;
        });
        return prevQueue.slice(1);
      }
      return prevQueue;
    });
  }, []);

  // Effect now has stable dependency and won't cause infinite loops
  React.useEffect(() => {
    processQueue();
  }, [processQueue, queue.length]); // Only re-run when queue length changes

  // Listen for achievement-unlocked custom events from GameContext
  React.useEffect(() => {
    const handleAchievementEvent = (event: CustomEvent<{ achievements: AchievementDefinition[] }>) => {
      if (event.detail?.achievements && event.detail.achievements.length > 0) {
        showMultipleAchievements(event.detail.achievements);
      }
    };

    window.addEventListener('achievement-unlocked', handleAchievementEvent as EventListener);
    return () => {
      window.removeEventListener('achievement-unlocked', handleAchievementEvent as EventListener);
    };
  }, [showMultipleAchievements]);

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  const handleExited = () => {
    setCurrent(null);
  };

  return (
    <AchievementContext.Provider value={{ showAchievementToast, showMultipleAchievements }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={5000}
        onClose={handleClose}
        TransitionComponent={SlideTransition}
        TransitionProps={{ onExited: handleExited }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: 2 }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 2,
            minWidth: 300,
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: `2px solid ${current ? RARITY_COLORS[current.achievement.rarity] : '#FFD700'}`,
            borderRadius: 3,
          }}
        >
          {current && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography
                sx={{
                  fontSize: '2.5rem',
                  lineHeight: 1,
                  filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))',
                }}
              >
                {current.achievement.icon}
              </Typography>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: RARITY_COLORS[current.achievement.rarity],
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    display: 'block',
                    mb: 0.5,
                  }}
                >
                  Achievement Unlocked!
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    mb: 0.5,
                  }}
                >
                  {current.achievement.name[language]}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '0.85rem',
                  }}
                >
                  {current.achievement.desc[language]}
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>
      </Snackbar>
    </AchievementContext.Provider>
  );
};

export const useAchievement = (): AchievementContextType => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievement must be used within an AchievementProvider');
  }
  return context;
};

export default AchievementContext;
