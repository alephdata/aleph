import convertUTCDateToLocalDate from 'util/convertUTCDateToLocalDate';
import { selectUnit } from '@formatjs/intl-utils';
import { FormattedRelativeTime } from 'react-intl';

export default function ({ date, utcDate }) {
  const dateObj = utcDate
    ? convertUTCDateToLocalDate(new Date(utcDate))
    : new Date(date);

  const { value, unit } = selectUnit(dateObj, Date.now());

  return (
    <time dateTime={dateObj.toISOString()}>
      <FormattedRelativeTime
        value={value}
        unit={unit}
        style="long"
        numeric="auto"
      />
    </time>
  );
}
