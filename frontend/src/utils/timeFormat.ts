/**
 * Format relative time with i18n support
 * Returns a function that formats time based on current language
 */

type TranslationFunc = (key: string, params?: Record<string, string | number>) => string;

export function formatRelativeTime(dateString: string, t?: TranslationFunc, locale?: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  // If no translation function provided, use English defaults
  if (!t) {
    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Use translation function
  if (diffSec < 60) {
    return t('time.justNow');
  }

  if (diffMin < 60) {
    return diffMin === 1
      ? t('time.minutesAgo', { count: diffMin })
      : t('time.minutesAgoPlural', { count: diffMin });
  }

  if (diffHour < 24) {
    return diffHour === 1
      ? t('time.hoursAgo', { count: diffHour })
      : t('time.hoursAgoPlural', { count: diffHour });
  }

  if (diffDay < 7) {
    return diffDay === 1
      ? t('time.daysAgo', { count: diffDay })
      : t('time.daysAgoPlural', { count: diffDay });
  }

  // For older dates, use locale-specific format
  const dateLocale = locale === 'vi' ? 'vi-VN' : 'en-US';
  return date.toLocaleDateString(dateLocale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Hook-friendly wrapper that returns a formatted time string
 * Usage: const formattedTime = useRelativeTime(dateString)
 */
export function createRelativeTimeFormatter(t: TranslationFunc, locale: string) {
  return (dateString: string) => formatRelativeTime(dateString, t, locale);
}
