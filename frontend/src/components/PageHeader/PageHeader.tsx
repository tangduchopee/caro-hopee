/**
 * PageHeader - Navigation header for sub-pages (Profile, Leaderboard, Login)
 * Provides consistent navigation back to Home and other pages
 * Style matches HomeSidebar color scheme
 */
import React from 'react';
import { Box, IconButton, Typography, useTheme, useMediaQuery } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HomeIcon from '@mui/icons-material/Home';
import PersonIcon from '@mui/icons-material/Person';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../i18n';

interface PageHeaderProps {
  /** Show back button instead of home button on left side */
  showBackButton?: boolean;
  /** Page title to display (optional) */
  title?: string;
  /** Hide profile link (useful for profile page itself) */
  hideProfileLink?: boolean;
  /** Hide leaderboard link (useful for leaderboard page itself) */
  hideLeaderboardLink?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  showBackButton = true,
  title,
  hideProfileLink = false,
  hideLeaderboardLink = false,
}) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleBack = () => {
    navigate('/');
  };

  const buttonStyle = {
    width: 40,
    height: 40,
    background: 'rgba(126, 200, 227, 0.1)',
    border: '1px solid rgba(126, 200, 227, 0.2)',
    color: '#7ec8e3',
    transition: 'all 0.2s ease',
    '&:hover': {
      background: 'rgba(126, 200, 227, 0.2)',
      borderColor: 'rgba(126, 200, 227, 0.4)',
    },
  };

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(126, 200, 227, 0.15)',
        px: { xs: 2, sm: 3 },
        py: 1.5,
      }}
    >
      <Box
        sx={{
          maxWidth: 'lg',
          mx: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        {/* Left section: Back/Home + Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {showBackButton ? (
            <IconButton onClick={handleBack} sx={buttonStyle} aria-label={t('common.back')}>
              <ArrowBackIcon />
            </IconButton>
          ) : (
            <IconButton component={Link} to="/" sx={buttonStyle} aria-label={t('nav.home')}>
              <HomeIcon />
            </IconButton>
          )}

          {/* Logo - links to home */}
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <Box
              component="img"
              src="/logo/glacier_logo.svg"
              alt="Glacier"
              sx={{
                height: isMobile ? 36 : 44,
                objectFit: 'contain',
              }}
            />
          </Link>

          {/* Page title (optional) */}
          {title && !isMobile && (
            <Typography
              sx={{
                ml: 1,
                color: '#2c3e50',
                fontWeight: 600,
                fontSize: '1rem',
              }}
            >
              {title}
            </Typography>
          )}
        </Box>

        {/* Right section: Navigation icons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!hideLeaderboardLink && (
            <IconButton
              component={Link}
              to="/leaderboard"
              sx={buttonStyle}
              aria-label={t('nav.leaderboard')}
            >
              <LeaderboardIcon />
            </IconButton>
          )}

          {isAuthenticated && !hideProfileLink && (
            <IconButton
              component={Link}
              to="/profile"
              sx={buttonStyle}
              aria-label={t('nav.profile')}
            >
              <PersonIcon />
            </IconButton>
          )}

          {/* Home button on right side for easy access */}
          <IconButton component={Link} to="/" sx={buttonStyle} aria-label={t('nav.home')}>
            <HomeIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default PageHeader;
