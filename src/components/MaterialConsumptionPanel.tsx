import { MaterialConsumption, BranchShortage } from '../types';
import { AlertTriangle } from 'lucide-react';

interface MaterialConsumptionPanelProps {
  consumptions: MaterialConsumption[];
  branchShortages?: BranchShortage[];
  onBranchClick?: (branchShortage: BranchShortage) => void;
}

export const MaterialConsumptionPanel = ({ 
  consumptions, 
  branchShortages = [],
  onBranchClick 
}: MaterialConsumptionPanelProps) => {
  const hasShortage = consumptions.some(c => c.isShortage);
  const shortageCount = consumptions.filter(c => c.isShortage).length;

  if (consumptions.length === 0 && branchShortages.length === 0) {
    return (
      <div className="consumption-panel">
        <h3>부자재 소모량 추산</h3>
        <p className="empty-state">대기 중인 주문이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="consumption-panel">
      <div className="consumption-header">
        <h3>부자재 소모량 추산</h3>
        {hasShortage && (
          <div className="shortage-summary">
            <AlertTriangle size={20} />
            <span>{shortageCount}개 부자재 부족</span>
          </div>
        )}
      </div>

      {branchShortages.length > 0 && (
        <div className="branch-shortages-section">
          <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 700 }}>지점별 재고 부족</h4>
          <div className="branch-shortage-list">
            {branchShortages.map(branch => (
              <div
                key={branch.branchName}
                className={`branch-shortage-item ${onBranchClick ? 'clickable' : ''}`}
                onClick={() => onBranchClick?.(branch)}
              >
                <div className="branch-shortage-header">
                  <span className="branch-name">{branch.branchName}</span>
                  <span className="shortage-count-badge">
                    {branch.totalShortageCount}개 부족
                  </span>
                </div>
                <div className="branch-shortage-info">
                  <span>주문: {branch.orders.length}건</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="consumption-list">
        <h4 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: 700 }}>전체 부자재 소모량</h4>
        {consumptions.map(consumption => (
          <div
            key={consumption.materialItemId}
            className={`consumption-item ${consumption.isShortage ? 'shortage' : ''}`}
          >
            <div className="consumption-item-header">
              <span className="material-name">{consumption.materialName}</span>
              {consumption.isShortage ? (
                <span className="status-badge warning">부족</span>
              ) : (
                <span className="status-badge success">충분</span>
              )}
            </div>
            <div className="consumption-details">
              <div className="consumption-detail-row">
                <span className="label">필요 수량:</span>
                <span className="value">{consumption.requiredQuantity.toLocaleString()}</span>
              </div>
              <div className="consumption-detail-row">
                <span className="label">현재 재고:</span>
                <span className="value">{consumption.availableQuantity.toLocaleString()}</span>
              </div>
              {consumption.isShortage && (
                <div className="consumption-detail-row shortage">
                  <span className="label">부족량:</span>
                  <span className="value shortage-amount">
                    {consumption.shortage.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
