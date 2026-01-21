/**
 * ProfileHeader - Displays user avatar, name, bio with edit button
 */
import React from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import { User } from '../../../types/user.types';
import { AvatarDisplay } from '../../../components/AvatarDisplay';
import { useLanguage } from '../../../i18n';
import ProfileRankBadge from './ProfileRankBadge';

interface ProfileHeaderProps {
  profile: User;
  onEditClick: () => void;
  totalScore?: number;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ profile, onEditClick, totalScore }) => {
  const { t } = useLanguage();

  const displayName = profile.displayName || profile.username;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'center', sm: 'flex-start' },
        gap: 3,
        mb: 4,
        pb: 4,
        borderBottom: '2px solid rgba(126, 200, 227, 0.2)',
        position: 'relative',
      }}
    >
      {/* Avatar */}
      <AvatarDisplay
        avatar={profile.avatar}
        email={profile.email}
        size={100}
        onClick={onEditClick}
        sx={{
          flexShrink: 0,
        }}
      />

      {/* User Info */}
      <Box
        sx={{
          flex: 1,
          textAlign: { xs: 'center', sm: 'left' },
          minWidth: 0,
        }}
      >
        {/* Display Name with Rank Badge */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
            justifyContent: { xs: 'center', sm: 'flex-start' },
            mb: 0.5,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: '#2c3e50',
              fontWeight: 700,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              wordBreak: 'break-word',
            }}
          >
            {displayName}
          </Typography>
          {totalScore !== undefined && totalScore > 0 && (
            <ProfileRankBadge totalScore={totalScore} compact />
          )}
        </Box>

        {/* Username (if different from displayName) */}
        {profile.displayName && (
          <Typography
            variant="body2"
            sx={{
              color: '#8a9ba8',
              fontSize: '0.9rem',
              mb: 1,
            }}
          >
            @{profile.username}
          </Typography>
        )}

        {/* Email */}
        <Typography
          variant="body1"
          sx={{
            color: '#5a6a7a',
            fontSize: '1rem',
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: { xs: 'center', sm: 'flex-start' },
            gap: 0.5,
          }}
        >
          📧 {profile.email}
        </Typography>

        {/* Bio */}
        {profile.bio && (
          <Typography
            variant="body2"
            sx={{
              color: '#6b7a8a',
              fontSize: '0.95rem',
              fontStyle: 'italic',
              mt: 2,
              maxWidth: '500px',
              wordBreak: 'break-word',
            }}
          >
            "{profile.bio}"
          </Typography>
        )}
      </Box>

      {/* Edit Button */}
      <Tooltip title={t('profile.editProfile')}>
        <IconButton
          onClick={onEditClick}
          sx={{
            position: { xs: 'absolute', sm: 'static' },
            top: { xs: 0 },
            right: { xs: 0 },
            background: 'linear-gradient(135deg, #7ec8e3 0%, #a8e6cf 100%)',
            color: '#fff',
            '&:hover': {
              background: 'linear-gradient(135deg, #5ba8c7 0%, #88d6b7 100%)',
            },
          }}
        >
          <EditIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ProfileHeader;
