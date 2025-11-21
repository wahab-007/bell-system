interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
}

export const MetricCard = ({ title, value, subtitle }: MetricCardProps) => (
  <div className="card" style={{ flex: 1 }}>
    <p style={{ color: '#667085', marginBottom: 8 }}>{title}</p>
    <h2 style={{ margin: 0 }}>{value}</h2>
    {subtitle && <p style={{ margin: 0, color: '#98a2b3' }}>{subtitle}</p>}
  </div>
);
