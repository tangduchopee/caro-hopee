/**
 * AvatarSelector - Component for selecting preset avatars or Gravatar
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Button,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { UserAvatar } from '../../../types/user.types';
import { PRESET_AVATARS, AvatarCategory } from '../../../constants/avatars';
import { getGravatarUrl, hasGravatar, getEmailHash } from '../../../utils/gravatar';
import { useLanguage } from '../../../i18n';

interface AvatarSelectorProps {
  currentAvatar?: UserAvatar;
  email: string;
  onSelect: (avatar: UserAvatar) => void;
}

const CATEGORIES: { id: AvatarCategory | 'gravatar'; label: { en: string; vi: string } }[] = [
  { id: 'default', label: { en: 'Default', vi: 'Mặc định' } },
  { id: 'animal', label: { en: 'Animals', vi: 'Động vật' } },
  { id: 'character', label: { en: 'Characters', vi: 'Nhân vật' } },
  { id: 'abstract', label: { en: 'Abstract', vi: 'Trừu tượng' } },
  { id: 'gravatar', label: { en: 'Gravatar', vi: 'Gravatar' } },
];

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
  currentAvatar,
  email,
  onSelect,
}) => {
  const { language, t } = useLanguage();
  const [selectedTab, setSelectedTab] = useState(0);
  const [gravatarAvailable, setGravatarAvailable] = useState<boolean | null>(null);
  const [checkingGravatar, setCheckingGravatar] = useState(false);

  // Check if Gravatar is available
  useEffect(() => {
    const checkGravatar = async () => {
      setCheckingGravatar(true);
      const available = await hasGravatar(email);
      setGravatarAvailable(available);
      setCheckingGravatar(false);
    };
    checkGravatar();
  }, [email]);

  const currentCategory = CATEGORIES[selectedTab];
  const isGravatarTab = currentCategory.id === 'gravatar';

  const isSelected = (avatar: UserAvatar): boolean => {
    if (!currentAvatar) return false;
    return currentAvatar.type === avatar.type && currentAvatar.value === avatar.value;
  };

  const handlePresetSelect = (presetId: string) => {
    onSelect({ type: 'preset', value: presetId });
  };

  const handleGravatarSelect = () => {
    onSelect({ type: 'gravatar', value: getEmailHash(email) });
  };

  const filteredAvatars = isGravatarTab
    ? []
    : PRESET_AVATARS.filter((a) => a.category === currentCategory.id);

  return (
    <Box>
      {/* Category Tabs */}
      <Tabs
        value={selectedTab}
        onChange={(_, newValue) => setSelectedTab(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 2,
          borderBottom: '1px solid rgba(126, 200, 227, 0.2)',
          '& .MuiTab-root': {
            textTransform: 'none',
            minWidth: 'auto',
            px: 2,
            fontSize: '0.875rem',
          },
          '& .Mui-selected': {
            color: '#7ec8e3',
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#7ec8e3',
          },
        }}
      >
        {CATEGORIES.map((cat, index) => (
          <Tab key={cat.id} label={cat.label[language]} />
        ))}
      </Tabs>

      {/* Gravatar Section */}
      {isGravatarTab ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          {checkingGravatar ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={40} sx={{ color: '#7ec8e3' }} />
              <Typography variant="body2" color="text.secondary">
                {t('profile.checkingGravatar')}
              </Typography>
            </Box>
          ) : gravatarAvailable ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={getGravatarUrl(email, 200)}
                  sx={{
                    width: 100,
                    height: 100,
                    border: isSelected({ type: 'gravatar', value: getEmailHash(email) })
                      ? '3px solid #7ec8e3'
                      : '3px solid rgba(126, 200, 227, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: '0 4px 12px rgba(126, 200, 227, 0.3)',
                    },
                  }}
                  onClick={handleGravatarSelect}
                />
                {isSelected({ type: 'gravatar', value: getEmailHash(email) }) && (
                  <CheckCircleIcon
                    sx={{
                      position: 'absolute',
                      bottom: -4,
                      right: -4,
                      color: '#7ec8e3',
                      bgcolor: '#fff',
                      borderRadius: '50%',
                      fontSize: 24,
                    }}
                  />
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {t('profile.gravatarFound')}
              </Typography>
              <Button
                variant={isSelected({ type: 'gravatar', value: getEmailHash(email) }) ? 'contained' : 'outlined'}
                onClick={handleGravatarSelect}
                sx={{
                  borderColor: '#7ec8e3',
                  color: isSelected({ type: 'gravatar', value: getEmailHash(email) }) ? '#fff' : '#7ec8e3',
                  background: isSelected({ type: 'gravatar', value: getEmailHash(email) })
                    ? 'linear-gradient(135deg, #7ec8e3 0%, #a8e6cf 100%)'
                    : 'transparent',
                  '&:hover': {
                    borderColor: '#5ba8c7',
                    background: isSelected({ type: 'gravatar', value: getEmailHash(email) })
                      ? 'linear-gradient(135deg, #5ba8c7 0%, #88d6b7 100%)'
                      : 'rgba(126, 200, 227, 0.1)',
                  },
                }}
              >
                {t('profile.useGravatar')}
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1" color="text.secondary">
                {t('profile.noGravatar')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('profile.gravatarHint')}
              </Typography>
              <Button
                variant="outlined"
                href="https://gravatar.com"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  borderColor: '#7ec8e3',
                  color: '#7ec8e3',
                  '&:hover': {
                    borderColor: '#5ba8c7',
                    background: 'rgba(126, 200, 227, 0.1)',
                  },
                }}
              >
                {t('profile.createGravatar')}
              </Button>
            </Box>
          )}
        </Box>
      ) : (
        /* Preset Avatars Grid */
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))',
            gap: 2,
            py: 2,
          }}
        >
          {filteredAvatars.map((avatar) => (
            <Box
              key={avatar.id}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={avatar.path}
                  sx={{
                    width: 60,
                    height: 60,
                    cursor: 'pointer',
                    border: isSelected({ type: 'preset', value: avatar.id })
                      ? '3px solid #7ec8e3'
                      : '3px solid transparent',
                    bgcolor: '#f8fbff',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.1)',
                      boxShadow: '0 4px 12px rgba(126, 200, 227, 0.3)',
                    },
                  }}
                  onClick={() => handlePresetSelect(avatar.id)}
                />
                {isSelected({ type: 'preset', value: avatar.id }) && (
                  <CheckCircleIcon
                    sx={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      color: '#7ec8e3',
                      bgcolor: '#fff',
                      borderRadius: '50%',
                      fontSize: 20,
                    }}
                  />
                )}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: '#5a6a7a',
                  fontSize: '0.7rem',
                  textAlign: 'center',
                }}
              >
                {avatar.name[language]}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default AvatarSelector;
