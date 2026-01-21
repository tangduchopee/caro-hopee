/**
 * Avatar preset definitions for user profiles
 */

export type AvatarCategory = 'default' | 'animal' | 'character' | 'abstract';

export interface PresetAvatar {
  id: string;
  category: AvatarCategory;
  path: string;
  name: {
    en: string;
    vi: string;
  };
}

export const PRESET_AVATARS: PresetAvatar[] = [
  // Default
  { id: 'default-1', category: 'default', path: '/avatars/default-1.svg', name: { en: 'Default', vi: 'Mặc định' } },

  // Animals
  { id: 'animal-1', category: 'animal', path: '/avatars/animal-1.svg', name: { en: 'Cat', vi: 'Mèo' } },
  { id: 'animal-2', category: 'animal', path: '/avatars/animal-2.svg', name: { en: 'Dog', vi: 'Chó' } },
  { id: 'animal-3', category: 'animal', path: '/avatars/animal-3.svg', name: { en: 'Fox', vi: 'Cáo' } },
  { id: 'animal-4', category: 'animal', path: '/avatars/animal-4.svg', name: { en: 'Owl', vi: 'Cú' } },
  { id: 'animal-5', category: 'animal', path: '/avatars/animal-5.svg', name: { en: 'Panda', vi: 'Gấu trúc' } },

  // Characters
  { id: 'character-1', category: 'character', path: '/avatars/character-1.svg', name: { en: 'Ninja', vi: 'Ninja' } },
  { id: 'character-2', category: 'character', path: '/avatars/character-2.svg', name: { en: 'Astronaut', vi: 'Phi hành gia' } },
  { id: 'character-3', category: 'character', path: '/avatars/character-3.svg', name: { en: 'Pirate', vi: 'Cướp biển' } },
  { id: 'character-4', category: 'character', path: '/avatars/character-4.svg', name: { en: 'Wizard', vi: 'Phù thủy' } },
  { id: 'character-5', category: 'character', path: '/avatars/character-5.svg', name: { en: 'Knight', vi: 'Hiệp sĩ' } },

  // Abstract
  { id: 'abstract-1', category: 'abstract', path: '/avatars/abstract-1.svg', name: { en: 'Geometric', vi: 'Hình học' } },
];

export const getAvatarById = (id: string): PresetAvatar | undefined => {
  return PRESET_AVATARS.find(avatar => avatar.id === id);
};

export const getAvatarsByCategory = (category: AvatarCategory): PresetAvatar[] => {
  return PRESET_AVATARS.filter(avatar => avatar.category === category);
};

export const DEFAULT_AVATAR: PresetAvatar = PRESET_AVATARS[0];
