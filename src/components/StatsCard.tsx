import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export const StatsCard = ({ title, value, icon: Icon, color, bgColor }: StatsCardProps) => {
  return (
    <div className="stats-card" style={{ backgroundColor: bgColor }}>
      <div className="stats-icon" style={{ color }}>
        <Icon size={32} />
      </div>
      <div className="stats-content">
        <h3 className="stats-title">{title}</h3>
        <p className="stats-value" style={{ color }}>{value}</p>
      </div>
    </div>
  );
};
