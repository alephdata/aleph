import { formatDistance } from 'date-fns';
import { en, ar, de, es, fr, pt, ru, tr } from 'date-fns/locale';

const locales = { en, ar, de, es, fr, pt, ru, tr };

export default function getFormattedDate(date, locale, formatStr = 'PP') {
  return formatDistance(date, Date.now(), {
    includeSeconds: true,
    addSuffix: true,
    locale: locales[locale] || locales['en'],
  });
}