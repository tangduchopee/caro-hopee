import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { logger } from '../utils/logger';

// Translation strings for GameErrorBoundary
// Since this is a class component, we cannot use hooks
const translations = {
  en: {
    title: 'Game Error',
    description: "Something went wrong with the game. Don't worry, your progress may be saved on the server.",
    tryAgain: 'Try Again',
    goHome: 'Go Home',
    reloadPage: 'Reload Page',
  },
  vi: {
    title: 'Lỗi trò chơi',
    description: 'Đã xảy ra lỗi với trò chơi. Đừng lo, tiến trình của bạn có thể đã được lưu trên server.',
    tryAgain: 'Thử lại',
    goHome: 'Về trang chủ',
    reloadPage: 'Tải lại trang',
  },
};

const getLanguage = (): 'en' | 'vi' => {
  const stored = localStorage.getItem('app-language');
  return (stored === 'vi' ? 'vi' : 'en');
};

interface Props {
  children: ReactNode;
  roomId?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * GameErrorBoundary - Specialized error boundary for game components
 * Fixes Critical Issue C6: Missing granular error boundaries
 *
 * This catches errors specifically in game-related components without
 * crashing the entire application. Users can recover or navigate away.
 */
class GameErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log error with game context
    logger.error('[GameErrorBoundary] Caught error in game component:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      roomId: this.props.roomId,
    });

    // Here you could send to error monitoring service
    // e.g., Sentry.captureException(error, { extra: { roomId: this.props.roomId } });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const lang = getLanguage();
      const t = translations[lang];

      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
            p: 3,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 450,
              textAlign: 'center',
              borderRadius: 3,
              background: 'linear-gradient(135deg, #fff 0%, #f8fbff 100%)',
              border: '2px solid rgba(126, 200, 227, 0.3)',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: '#e74c3c',
                fontWeight: 600,
                mb: 2,
              }}
            >
              {t.title}
            </Typography>

            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              {t.description}
            </Typography>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                sx={{
                  mb: 3,
                  p: 2,
                  bgcolor: 'rgba(231, 76, 60, 0.1)',
                  borderRadius: 2,
                  textAlign: 'left',
                  overflow: 'auto',
                  maxHeight: 120,
                }}
              >
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: '#c0392b',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {this.state.error.message}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                onClick={this.handleRetry}
                sx={{
                  borderColor: '#7ec8e3',
                  color: '#2c3e50',
                  '&:hover': {
                    borderColor: '#5ba8c7',
                    bgcolor: 'rgba(126, 200, 227, 0.1)',
                  },
                }}
              >
                {t.tryAgain}
              </Button>

              <Button
                variant="outlined"
                onClick={this.handleGoHome}
                sx={{
                  borderColor: '#a8e6cf',
                  color: '#2c3e50',
                  '&:hover': {
                    borderColor: '#88d6b7',
                    bgcolor: 'rgba(168, 230, 207, 0.1)',
                  },
                }}
              >
                {t.goHome}
              </Button>

              <Button
                variant="contained"
                onClick={this.handleReload}
                sx={{
                  background: 'linear-gradient(135deg, #7ec8e3 0%, #a8e6cf 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5ba8c7 0%, #88d6b7 100%)',
                  },
                }}
              >
                {t.reloadPage}
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default GameErrorBoundary;
