import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Schedule } from '../../types/api';

interface Props {
  schedules: Schedule[];
}

const toChartData = (schedules: Schedule[]) =>
  schedules.map((schedule) => ({
    name: schedule.name,
    duration: schedule.durationSec,
    time: schedule.time,
  }));

export const ScheduleTimeline = ({ schedules }: Props) => (
  <div className="card" style={{ height: 320 }}>
    <h3 style={{ marginTop: 0 }}>Bell Durations</h3>
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={toChartData(schedules)}>
        <defs>
          <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#675afe" stopOpacity={0.7} />
            <stop offset="100%" stopColor="#675afe" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="duration" stroke="#675afe" fill="url(#colorDuration)" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);
