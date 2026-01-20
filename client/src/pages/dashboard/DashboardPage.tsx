import { useEffect, useMemo, useRef, useState } from 'react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { Topbar } from '../../components/layout/Topbar';
import { MetricCard } from '../../components/dashboard/MetricCard';
import { BellStatusList } from '../../components/dashboard/BellStatusList';
import { ScheduleTimeline } from '../../components/dashboard/ScheduleTimeline';
import { useFetch } from '../../hooks/useFetch';
import { fetchBellEvents, fetchBlocks, fetchBells, fetchBulbs, fetchOrgLogs, fetchSchedules } from '../../services/api';
import { useAuthStore } from '../../state/useAuthStore';
import type { EventLog } from '../../types/api';

dayjs.extend(utc);
dayjs.extend(timezone);

export const DashboardPage = () => {
  const { data: blocks = [] } = useFetch(fetchBlocks, []);
  const { data: bells = [] } = useFetch(fetchBells, []);
  const { data: events = [] } = useFetch(fetchBellEvents, []);
  const activeEventId = useMemo(() => events.find((event) => event.active)?._id, [events]);
  const { data: schedules = [] } = useFetch(
    () => (activeEventId ? fetchSchedules(activeEventId) : Promise.resolve({ data: [] })),
    [activeEventId],
  );
  const { data: bulbs = [] } = useFetch(fetchBulbs, []);
  const organisation = useAuthStore((s) => s.organisation);
  const [ringEvent, setRingEvent] = useState<{ blockName: string; bellLabel: string } | null>(null);
  const lastLogRef = useRef<string | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const nextBell = useMemo<string>(() => {
    if (!schedules.length || !organisation?.timezone) return '--';
    const tz = organisation.timezone;
    const now = dayjs().tz(tz);
    let best: Dayjs | undefined;

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

    if (!best) return '--';
    return best.format('ddd HH:mm');
  }, [organisation?.timezone, schedules]);

  useEffect(() => {
    let mounted = true;
    const storageKey = 'lastBellLogTimestamp';

    const initTimestamp = () => {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        lastLogRef.current = stored;
        return;
      }
      const now = new Date().toISOString();
      lastLogRef.current = now;
      localStorage.setItem(storageKey, now);
    };

    const handleBellLog = (log: EventLog) => {
      const bell = log.bell && typeof log.bell === 'object' ? log.bell : null;
      const blockName =
        bell && typeof bell.block === 'object' && bell.block && 'name' in bell.block
          ? String(bell.block.name)
          : 'Unknown block';
      const bellLabel = bell?.label ? bell.label : 'Bell';

      setRingEvent({ blockName, bellLabel });
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => {
        if (mounted) setRingEvent(null);
      }, 5000);
    };

    const poll = async () => {
      try {
        const { data } = await fetchOrgLogs({
          limit: 1,
          type: 'bell_trigger',
          since: lastLogRef.current ?? undefined,
        });
        if (!mounted) return;
        if (data.length) {
          const latest = data[0];
          lastLogRef.current = latest.timestamp;
          localStorage.setItem(storageKey, latest.timestamp);
          handleBellLog(latest);
        }
      } catch {
        // ignore polling errors to avoid UI flicker
      }
    };

    initTimestamp();
    poll();
    const interval = window.setInterval(poll, 5000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  return (
    <>
      <Topbar title="Command Center" />
      {ringEvent && (
        <div className="bell-ring-overlay">
        <div className="bell-ring-card">
          <div className="bell-ring-pulse" />
          <h2 className="bell-ring-title">Bell Ringing</h2>
          <p className="bell-ring-subtitle">
            {ringEvent.bellLabel} · {ringEvent.blockName}
          </p>
        </div>
      </div>
      )}
      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
        <MetricCard title="Blocks" value={String(blocks.length)} subtitle="Connected buildings" />
        <MetricCard title="Active Bells" value={String(bells.filter((bell) => bell.online).length)} subtitle="Online devices" />
        <MetricCard title="Bulbs On" value={`${bulbs.filter((b) => b.state).length}/${bulbs.length || 0}`} subtitle="Lights currently on" />
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
