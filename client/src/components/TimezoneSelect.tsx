import type { CSSProperties } from 'react';

const fallbackZones = [
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Africa/Johannesburg',
];

const getTimezones = () => {
  if (typeof Intl !== 'undefined' && typeof (Intl as any).supportedValuesOf === 'function') {
    return (Intl as any).supportedValuesOf('timeZone') as string[];
  }
  return fallbackZones;
};

const formatOffset = (tz: string) => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
    const parts = formatter.formatToParts(new Date());
    const offset = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
    return offset;
  } catch {
    return '';
  }
};

interface Props {
  value: string;
  onChange: (tz: string) => void;
  style?: CSSProperties;
}

export const TimezoneSelect = ({ value, onChange, style }: Props) => {
  const zones = getTimezones();
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...baseStyle, ...style }}>
      {zones.map((tz) => (
        <option key={tz} value={tz}>
          {tz} {formatOffset(tz)}
        </option>
      ))}
    </select>
  );
};

const baseStyle: CSSProperties = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: 12,
  border: '1px solid #d0d7f4',
};
