import { PureComponent } from 'react';

interface IDurationProps {
  // Seconds (may be fractional, as ffprobe / mutagen-derived metadata often
  // carries millisecond precision).
  value: number;
}

class Duration extends PureComponent<IDurationProps> {
  render() {
    const { value } = this.props;
    if (value === null || value === undefined || isNaN(+value)) {
      return null;
    }
    const total = Math.round(+value);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return hours > 0
      ? `${hours}:${pad(minutes)}:${pad(seconds)}`
      : `${minutes}:${pad(seconds)}`;
  }
}

export default Duration;
