import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { logger } from '../utils/logger';

// Translation strings for ErrorBoundary
// Since this is a class component, we cannot use hooks
// These are defined outside to support both languages
const translations = {
  en: {
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again.',
    tryAgain: 'Try Again',
    reloadPage: 'Reload Page',
  },
  vi: {
    title: 'Đã xảy ra lỗi',
    description: 'Đã có lỗi không mong muốn. Vui lòng thử lại.',
    tryAgain: 'Thử lại',
    reloadPage: 'Tải lại trang',
  },
};

const getLanguage = (): 'en' | 'vi' => {
  const stored = localStorage.getItem('app-language');
  return (stored === 'vi' ? 'vi' : 'en');
};

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component to catch React errors gracefully (fixes Issue #18)
 * Prevents the entire app from crashing when a component throws an error
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
    // Here you could send error to monitoring service (e.g., Sentry)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const lang = getLanguage();
      const t = translations[lang];

      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            p: 3,
            bgcolor: '#f5f5f5',
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 500,
              textAlign: 'center',
              borderRadius: 2,
            }}
          >
            <Typography variant="h5" color="error" gutterBottom>
              {t.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t.description}
            </Typography>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Typography
                variant="caption"
                component="pre"
                sx={{
                  mb: 2,
                  p: 1,
                  bgcolor: '#f0f0f0',
                  borderRadius: 1,
                  overflow: 'auto',
                  textAlign: 'left',
                  maxHeight: 150,
                }}
              >
                {this.state.error.message}
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button variant="outlined" onClick={this.handleRetry}>
                {t.tryAgain}
              </Button>
              <Button variant="contained" onClick={this.handleReload}>
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

export default ErrorBoundary;
