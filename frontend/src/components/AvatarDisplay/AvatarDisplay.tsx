/**
 * AvatarDisplay - Reusable avatar component supporting presets and Gravatar
 */
import React from 'react';
import { Avatar, Box, SxProps, Theme } from '@mui/material';
import { UserAvatar } from '../../types/user.types';
import { getAvatarById, DEFAULT_AVATAR } from '../../constants/avatars';
import { getGravatarUrl } from '../../utils/gravatar';

interface AvatarDisplayProps {
  avatar?: UserAvatar;
  email?: string;
  size?: number;
  sx?: SxProps<Theme>;
  onClick?: () => void;
}

const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatar,
  email,
  size = 64,
  sx,
  onClick,
}) => {
  const getAvatarSrc = (): string => {
    if (!avatar) {
      return DEFAULT_AVATAR.path;
    }

    if (avatar.type === 'gravatar' && email) {
      return getGravatarUrl(email, size * 2); // 2x for retina
    }

    if (avatar.type === 'preset') {
      const preset = getAvatarById(avatar.value);
      return preset?.path || DEFAULT_AVATAR.path;
    }

    return DEFAULT_AVATAR.path;
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        display: 'inline-flex',
        ...sx,
      }}
    >
      <Avatar
        src={getAvatarSrc()}
        sx={{
          width: size,
          height: size,
          border: '3px solid',
          borderColor: 'rgba(126, 200, 227, 0.3)',
          bgcolor: '#f8fbff',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          ...(onClick && {
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0 4px 12px rgba(126, 200, 227, 0.3)',
            },
          }),
        }}
      />
    </Box>
  );
};

export default AvatarDisplay;
