import { Order, InventoryItem, BranchShortage } from '../types';
import { Package, AlertTriangle, MapPin, ShoppingCart, Clock, CheckCircle } from 'lucide-react';

interface BranchManagementProps {
  branchShortages: BranchShortage[];
  orders: Order[];
  items: InventoryItem[];
  onBranchClick?: (branchShortage: BranchShortage) => void;
  onBranchDetail?: (branchName: string) => void;
}

export const BranchManagement = ({ branchShortages, orders, items, onBranchClick, onBranchDetail }: BranchManagementProps) => {
  const getBranchNames = () => {
    const branchSet = new Set<string>();
    orders.forEach(order => branchSet.add(order.branchName));
    return Array.from(branchSet).sort();
  };

  const getBranchStats = (branchName: string) => {
    const branchOrders = orders.filter(order => order.branchName === branchName);
    const pendingOrders = branchOrders.filter(order => order.status === 'pending').length;
    const processingOrders = branchOrders.filter(order => order.status === 'processing').length;
    const completedOrders = branchOrders.filter(order => order.status === 'completed').length;
    const branchShortage = branchShortages.find(bs => bs.branchName === branchName);
    const shortageCount = branchShortage?.totalShortageCount || 0;

    return {
      totalOrders: branchOrders.length,
      pendingOrders,
      processingOrders,
      completedOrders,
      shortageCount,
      branchShortage,
    };
  };

  const branches = getBranchNames();

  if (branches.length === 0) {
    return (
      <div className="branch-management">
        <h2>지점 관리</h2>
        <p className="empty-state">등록된 지점이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="branch-management">
      <h2>지점 관리</h2>
      <div className="branch-grid">
        {branches.map(branchName => {
          const stats = getBranchStats(branchName);
          return (
            <div 
              key={branchName} 
              className="branch-card" 
              onClick={() => onBranchDetail?.(branchName)}
              style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <div className="branch-card-header">
                <MapPin size={24} />
                <h3>{branchName}</h3>
              </div>
              <div className="branch-stats">
                <div className="branch-stat-item">
                  <ShoppingCart size={18} />
                  <div>
                    <span className="stat-label">총 발주</span>
                    <span className="stat-value">{stats.totalOrders}건</span>
                  </div>
                </div>
                <div className="branch-stat-item">
                  <Clock size={18} />
                  <div>
                    <span className="stat-label">대기</span>
                    <span className="stat-value">{stats.pendingOrders}건</span>
                  </div>
                </div>
                <div className="branch-stat-item">
                  <Package size={18} />
                  <div>
                    <span className="stat-label">처리중</span>
                    <span className="stat-value">{stats.processingOrders}건</span>
                  </div>
                </div>
                <div className="branch-stat-item">
                  <CheckCircle size={18} />
                  <div>
                    <span className="stat-label">완료</span>
                    <span className="stat-value">{stats.completedOrders}건</span>
                  </div>
                </div>
              </div>
              {stats.shortageCount > 0 && (
                <div className="branch-shortage-alert" onClick={() => onBranchClick?.(stats.branchShortage!)}>
                  <AlertTriangle size={20} />
                  <span>{stats.shortageCount}개 부자재 부족</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
