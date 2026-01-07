import { BOMItem, InventoryItem } from '../types';
import { Receipt } from 'lucide-react';

interface BOMReceiptProps {
  finishedItem: InventoryItem;
  bomItems: BOMItem[];
  materialItems: InventoryItem[];
}

export const BOMReceipt = ({ finishedItem, bomItems, materialItems }: BOMReceiptProps) => {
  if (bomItems.length === 0) {
    return (
      <div className="bom-receipt-empty">
        <p>BOM이 설정되지 않았습니다.</p>
      </div>
    );
  }

  return (
    <div className="bom-receipt">
      <div className="bom-receipt-header">
        <Receipt size={24} />
        <h3>{finishedItem.name} 소모 부자재 내역</h3>
      </div>
      <div className="bom-receipt-content">
        <div className="bom-receipt-info">
          <p><strong>완성재고:</strong> {finishedItem.name}</p>
          <p><strong>기준:</strong> 완성재고 1개당 소모량</p>
        </div>
        <table className="bom-receipt-table">
          <thead>
            <tr>
              <th>순번</th>
              <th>부자재명</th>
              <th>소모량</th>
              <th>단위</th>
            </tr>
          </thead>
          <tbody>
            {bomItems.map((bom, index) => {
              const material = materialItems.find(m => m.id === bom.materialItemId);
              if (!material) return null;
              return (
                <tr key={bom.id}>
                  <td>{index + 1}</td>
                  <td>{material.name}</td>
                  <td>{bom.quantity}</td>
                  <td>{material.unit}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
