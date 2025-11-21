import { useMemo } from 'react';
import { Topbar } from '../../components/layout/Topbar';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { BellStatusList } from '../../components/dashboard/BellStatusList';
import { ScheduleTimeline } from '../../components/dashboard/ScheduleTimeline';
import { useFetch } from '../../hooks/useFetch';
import { fetchBlocks, fetchBells, fetchSchedules } from '../../services/api';

export const DashboardPage = () => {
  const { data: blocks = [] } = useFetch(fetchBlocks, []);
  const { data: bells = [] } = useFetch(fetchBells, []);
  const { data: schedules = [] } = useFetch(fetchSchedules, []);

  const nextBell = useMemo(() => schedules[0]?.time ?? '—', [schedules]);

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
