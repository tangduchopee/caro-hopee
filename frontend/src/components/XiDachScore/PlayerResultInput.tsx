/**
 * Blackjack Score Tracker - Player Result Input
 * Form to input match result for a single player (non-dealer only)
 * Uses button-based input with +/- controls
 */

import React from 'react';
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  Checkbox,
  FormControlLabel,
  Chip,
  Collapse,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { XiDachPlayer, XiDachSettings } from '../../types/xi-dach-score.types';
import { calculateScoreChange } from '../../utils/xi-dach-score-storage';
import { useLanguage } from '../../i18n';

export interface PlayerResultInputData {
  playerId: string;
  outcome: 'win' | 'lose' | null;
  tuCount: number;          // Number of wins (thắng)
  xiBanCount: number;       // Blackjack multiplier
  nguLinhCount: number;     // Five card multiplier
  penalty28: boolean;
  penalty28Recipients: string[];
}

interface PlayerResultInputProps {
  player: XiDachPlayer;
  data: PlayerResultInputData;
  settings: XiDachSettings;
  otherPlayers: XiDachPlayer[];
  onChange: (data: PlayerResultInputData) => void;
  isDealer: boolean;
}

/**
 * Counter Button Component for +/- input
 */
const CounterButton: React.FC<{
  label: string;
  value: number;
  maxValue: number;
  minValue?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  color?: string;
}> = ({ label, value, maxValue, minValue = 0, disabled = false, onChange, color = '#FF8A65' }) => {
  const canDecrease = value > minValue && !disabled;
  const canIncrease = value < maxValue && !disabled;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 1,
        bgcolor: disabled ? '#f5f5f5' : '#fff',
        borderRadius: 2,
        border: `1px solid ${disabled ? '#e0e0e0' : '#eee'}`,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <IconButton
        size="small"
        onClick={() => onChange(value - 1)}
        disabled={!canDecrease}
        sx={{
          bgcolor: canDecrease ? `${color}15` : 'transparent',
          '&:hover': { bgcolor: canDecrease ? `${color}25` : 'transparent' },
        }}
      >
        <RemoveIcon sx={{ fontSize: 18, color: canDecrease ? color : '#ccc' }} />
      </IconButton>
      <Box sx={{ textAlign: 'center', minWidth: 60 }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: disabled ? '#999' : '#2c3e50' }}>
          {value}
        </Typography>
        <Typography variant="caption" sx={{ color: '#95a5a6', fontSize: '0.65rem' }}>
          {label}
        </Typography>
      </Box>
      <IconButton
        size="small"
        onClick={() => onChange(value + 1)}
        disabled={!canIncrease}
        sx={{
          bgcolor: canIncrease ? `${color}15` : 'transparent',
          '&:hover': { bgcolor: canIncrease ? `${color}25` : 'transparent' },
        }}
      >
        <AddIcon sx={{ fontSize: 18, color: canIncrease ? color : '#ccc' }} />
      </IconButton>
    </Box>
  );
};

const PlayerResultInput: React.FC<PlayerResultInputProps> = ({
  player,
  data,
  settings,
  otherPlayers,
  onChange,
  isDealer,
}) => {
  const { t } = useLanguage();

  // Calculate preview score for non-dealers
  const previewScore = data.outcome
    ? calculateScoreChange(
        {
          playerId: data.playerId,
          tuCount: data.tuCount,
          outcome: data.outcome,
          xiBanCount: data.xiBanCount,
          nguLinhCount: data.nguLinhCount,
          penalty28: data.penalty28,
          penalty28Recipients: data.penalty28Recipients,
        },
        settings
      )
    : null;

  // Calculate penalty amount (either fixed or based on bet)
  // Bet amount = (tuCount + xiBanCount + nguLinhCount) × pointsPerTu
  const betAmount = (data.tuCount + data.xiBanCount + data.nguLinhCount) * settings.pointsPerTu;
  const penaltyAmountPerRecipient = settings.penalty28Enabled
    ? settings.penalty28Amount
    : betAmount;

  // Max constraint: xiBan + nguLinh <= tuCount
  const maxBonusTotal = data.tuCount;
  const currentBonusTotal = data.xiBanCount + data.nguLinhCount;

  // Max xiBan = tuCount - nguLinhCount
  const maxXiBan = Math.max(0, data.tuCount - data.nguLinhCount);
  // Max nguLinh = tuCount - xiBanCount
  const maxNguLinh = Math.max(0, data.tuCount - data.xiBanCount);

  const handleOutcomeChange = (
    _: React.MouseEvent<HTMLElement>,
    newOutcome: 'win' | 'lose' | null
  ) => {
    if (newOutcome !== null) {
      // Reset bonus counts when changing outcome
      onChange({
        ...data,
        outcome: newOutcome,
        tuCount: newOutcome === 'win' ? Math.max(1, data.tuCount) : data.tuCount,
        xiBanCount: 0,
        nguLinhCount: 0,
      });
    }
  };

  const handleTuCountChange = (value: number) => {
    // When reducing tuCount, also reduce bonuses if they exceed new max
    const newTuCount = Math.max(data.outcome === 'win' ? 1 : 0, value);
    let newXiBan = data.xiBanCount;
    let newNguLinh = data.nguLinhCount;

    // Adjust bonuses if they exceed new tuCount
    if (newXiBan + newNguLinh > newTuCount) {
      // Reduce xiBan first, then nguLinh
      const excess = (newXiBan + newNguLinh) - newTuCount;
      if (newXiBan >= excess) {
        newXiBan -= excess;
      } else {
        newNguLinh -= (excess - newXiBan);
        newXiBan = 0;
      }
    }

    onChange({
      ...data,
      tuCount: newTuCount,
      xiBanCount: Math.max(0, newXiBan),
      nguLinhCount: Math.max(0, newNguLinh),
    });
  };

  const handleXiBanChange = (value: number) => {
    onChange({ ...data, xiBanCount: Math.max(0, Math.min(value, maxXiBan)) });
  };

  const handleNguLinhChange = (value: number) => {
    onChange({ ...data, nguLinhCount: Math.max(0, Math.min(value, maxNguLinh)) });
  };

  const handlePenalty28Toggle = (checked: boolean) => {
    onChange({
      ...data,
      penalty28: checked,
      penalty28Recipients: checked ? data.penalty28Recipients : [],
    });
  };

  const handleRecipientToggle = (recipientId: string) => {
    const isSelected = data.penalty28Recipients.includes(recipientId);
    const newRecipients = isSelected
      ? data.penalty28Recipients.filter((id) => id !== recipientId)
      : [...data.penalty28Recipients, recipientId];
    onChange({ ...data, penalty28Recipients: newRecipients });
  };

  // Dealer card shows different UI - just displays that score will be auto-calculated
  if (isDealer) {
    return (
      <Box
        sx={{
          bgcolor: '#fff',
          borderRadius: 2,
          p: 2,
          border: '2px solid #FF8A65',
          position: 'relative',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <span style={{ marginRight: 4 }}>👑</span>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2c3e50' }}>
            {player.name}
          </Typography>
          <Chip
            label={t('xiDachScore.dealer.label')}
            size="small"
            sx={{
              ml: 1,
              height: 20,
              fontSize: '0.65rem',
              bgcolor: '#FF8A65',
              color: '#fff',
            }}
          />
        </Box>
        <Box
          sx={{
            p: 2,
            bgcolor: 'rgba(255, 138, 101, 0.05)',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={{ color: '#7f8c8d' }}>
            {t('xiDachScore.dealer.autoCalculate')}
          </Typography>
          <Typography variant="caption" sx={{ color: '#95a5a6' }}>
            {t('xiDachScore.dealer.autoCalculateHint')}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: '#fff',
        borderRadius: 2,
        p: 2,
        border: '1px solid #eee',
        position: 'relative',
      }}
    >
      {/* Player Name */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2c3e50' }}>
          {player.name}
        </Typography>
      </Box>

      {/* Win/Lose Toggle */}
      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={data.outcome}
          exclusive
          onChange={handleOutcomeChange}
          fullWidth
          size="small"
        >
          <ToggleButton
            value="win"
            sx={{
              flex: 1,
              py: 1,
              '&.Mui-selected': {
                bgcolor: '#2e7d32',
                color: '#fff',
                '&:hover': { bgcolor: '#1b5e20' },
              },
            }}
          >
            {t('xiDachScore.match.win')}
          </ToggleButton>
          <ToggleButton
            value="lose"
            sx={{
              flex: 1,
              py: 1,
              '&.Mui-selected': {
                bgcolor: '#E64A19',
                color: '#fff',
                '&:hover': { bgcolor: '#BF360C' },
              },
            }}
          >
            {t('xiDachScore.match.lose')}
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Show counters only when outcome is selected */}
      <Collapse in={data.outcome !== null}>
        {/* Tu count - label changes based on win/lose */}
        <Box sx={{ mb: 2 }}>
          <CounterButton
            label={data.outcome === 'win'
              ? t('xiDachScore.match.winCount')
              : t('xiDachScore.match.loseCount')}
            value={data.tuCount}
            maxValue={10}
            minValue={data.outcome === 'win' ? 1 : 0}
            onChange={handleTuCountChange}
            color={data.outcome === 'win' ? '#2e7d32' : '#E64A19'}
          />
        </Box>

        {/* Xì Bàn & Ngũ Linh - only show when there are wins */}
        <Collapse in={data.tuCount > 0}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <CounterButton
                label={t('xiDachScore.match.xiBanShort')}
                value={data.xiBanCount}
                maxValue={maxXiBan}
                minValue={0}
                disabled={maxXiBan === 0}
                onChange={handleXiBanChange}
                color="#FFB74D"
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <CounterButton
                label={t('xiDachScore.match.nguLinhShort')}
                value={data.nguLinhCount}
                maxValue={maxNguLinh}
                minValue={0}
                disabled={maxNguLinh === 0}
                onChange={handleNguLinhChange}
                color="#FFCC80"
              />
            </Box>
          </Box>

          {/* Bonus constraint hint */}
          {data.tuCount > 0 && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                textAlign: 'center',
                color: currentBonusTotal >= maxBonusTotal ? '#FF8A65' : '#95a5a6',
                mb: 2,
              }}
            >
              {t('xiDachScore.match.bonusConstraint', {
                current: currentBonusTotal,
                max: maxBonusTotal,
              })}
            </Typography>
          )}
        </Collapse>

        {/* Penalty 28 - only show for lose outcome */}
        <Collapse in={data.outcome === 'lose'}>
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={data.penalty28}
                  onChange={(e) => handlePenalty28Toggle(e.target.checked)}
                  sx={{
                    color: '#FF8A65',
                    '&.Mui-checked': { color: '#FF8A65' },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: '#7f8c8d' }}>
                  {settings.penalty28Enabled
                    ? t('xiDachScore.match.penalty28LabelFixed', { amount: settings.penalty28Amount })
                    : t('xiDachScore.match.penalty28LabelBet', { amount: penaltyAmountPerRecipient })}
                </Typography>
              }
            />

            <Collapse in={data.penalty28}>
              <Box
                sx={{
                  ml: 4,
                  mt: 1,
                  p: 1.5,
                  bgcolor: '#f8f9fa',
                  borderRadius: 1,
                }}
              >
                <Typography variant="caption" sx={{ color: '#7f8c8d', mb: 1, display: 'block' }}>
                  {t('xiDachScore.match.penalty28To')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {otherPlayers.map((p) => (
                    <Chip
                      key={p.id}
                      label={p.name}
                      size="small"
                      onClick={() => handleRecipientToggle(p.id)}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: data.penalty28Recipients.includes(p.id)
                          ? '#FF8A65'
                          : '#e0e0e0',
                        color: data.penalty28Recipients.includes(p.id)
                          ? '#fff'
                          : '#666',
                        '&:hover': {
                          bgcolor: data.penalty28Recipients.includes(p.id)
                            ? '#E64A19'
                            : '#d0d0d0',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Collapse>
          </Box>
        </Collapse>

        {/* Score Preview */}
        {data.outcome && (
          <Box
            sx={{
              p: 1.5,
              bgcolor: previewScore && previewScore >= 0 ? 'rgba(39, 174, 96, 0.1)' : 'rgba(255, 138, 101, 0.1)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="body2" sx={{ color: '#7f8c8d' }}>
              {t('xiDachScore.match.scoreChange')}
            </Typography>
            <Box sx={{ textAlign: 'right' }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: previewScore && previewScore >= 0 ? '#2e7d32' : '#E64A19',
                }}
              >
                {previewScore !== null ? (
                  <>
                    {previewScore >= 0 ? '+' : ''}
                    {previewScore}đ
                  </>
                ) : (
                  '—'
                )}
              </Typography>
              {(data.xiBanCount > 0 || data.nguLinhCount > 0) && (
                <Typography variant="caption" sx={{ color: '#95a5a6' }}>
                  ×{1 + data.xiBanCount + data.nguLinhCount}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Collapse>
    </Box>
  );
};

export default PlayerResultInput;
