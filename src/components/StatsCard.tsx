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
    <div className="stats-card">
      <div className="stats-card-header">
        <div className="stats-icon" style={{ backgroundColor: bgColor, color }}>
          <Icon size={24} />
        </div>
      </div>
      <div className="stats-content">
        <h3 className="stats-title">{title}</h3>
        <p className="stats-value" style={{ color }}>{value}</p>
      </div>
    </div>
  );
};
