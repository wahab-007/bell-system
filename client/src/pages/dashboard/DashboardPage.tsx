import { useMemo } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Topbar } from '../../components/layout/Topbar';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { BellStatusList } from '../../components/dashboard/BellStatusList';
import { ScheduleTimeline } from '../../components/dashboard/ScheduleTimeline';
import { useFetch } from '../../hooks/useFetch';
import { fetchBlocks, fetchBells, fetchSchedules } from '../../services/api';
import { useAuthStore } from '../../state/useAuthStore';

dayjs.extend(utc);
dayjs.extend(timezone);

export const DashboardPage = () => {
  const { data: blocks = [] } = useFetch(fetchBlocks, []);
  const { data: bells = [] } = useFetch(fetchBells, []);
  const { data: schedules = [] } = useFetch(fetchSchedules, []);
  const organisation = useAuthStore((s) => s.organisation);

  const nextBell = useMemo(() => {
    if (!schedules.length || !organisation?.timezone) return '—';
    const tz = organisation.timezone;
    const now = dayjs().tz(tz);
    let best: dayjs.Dayjs | null = null;

    schedules
      .filter((s) => s.active)
      .forEach((schedule) => {
        const [hour, minute] = schedule.time.split(':').map(Number);
        const days = schedule.repeatPattern?.daysOfWeek ?? [0, 1, 2, 3, 4, 5, 6];
        for (let offset = 0; offset < 7; offset++) {
          const candidate = now
            .add(offset, 'day')
            .set('hour', hour)
            .set('minute', minute)
            .set('second', 0)
            .set('millisecond', 0);
          if (!days.includes(candidate.day())) continue;
          if (candidate.isBefore(now)) continue;
          if (!best || candidate.isBefore(best)) {
            best = candidate;
          }
        }
      });

    return best ? best.format('ddd HH:mm') : '—';
  }, [organisation?.timezone, schedules]);

  return (
    <>
      <Topbar title="Command Center" />
      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
        <MetricCard title="Blocks" value={String(blocks.length)} subtitle="Connected buildings" />
        <MetricCard title="Active Bells" value={String(bells.filter((bell) => bell.online).length)} subtitle="Online devices" />
        <MetricCard title="Schedules" value={String(schedules.length)} subtitle="Configured timings" />
        <MetricCard title="Next Bell" value={nextBell} subtitle="HH:MM" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
        <ScheduleTimeline schedules={schedules} />
        <BellStatusList bells={bells.slice(0, 5)} />
      </div>
    </>
  );
};
