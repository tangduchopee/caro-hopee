/**
 * Xì Dách Score Tracker - Main Content Wrapper
 * Renders the appropriate view based on current state
 */

import React from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useXiDachScore } from './XiDachScoreContext';
import SessionList from './SessionList';
import SessionSetup from './SessionSetup';
import GamePlaying from './GamePlaying';
import SessionSummary from './SessionSummary';

const XiDachScoreContent: React.FC = () => {
  const { viewMode, loading, currentSession } = useXiDachScore();

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#FFF8F5',
        }}
      >
        <CircularProgress sx={{ color: '#FF8A65' }} />
      </Box>
    );
  }

  switch (viewMode) {
    case 'setup':
      return <SessionSetup />;
    case 'playing':
      return <GamePlaying />;
    case 'history':
      // History view is part of GamePlaying screen
      return <GamePlaying />;
    case 'summary':
      // Show summary if session is ended, else show GamePlaying
      if (currentSession?.status === 'ended') {
        return <SessionSummary />;
      }
      return <GamePlaying />;
    case 'list':
    default:
      return <SessionList />;
  }
};

export default XiDachScoreContent;
