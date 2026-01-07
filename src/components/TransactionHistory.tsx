import { Transaction, InventoryItem } from '../types';
import { ArrowDown, ArrowUp } from 'lucide-react';

interface TransactionHistoryProps {
  transactions: Transaction[];
  items: InventoryItem[];
  limit?: number;
}

export const TransactionHistory = ({ transactions, items, limit = 10 }: TransactionHistoryProps) => {
  const sortedTransactions = [...transactions]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

  const getItemName = (itemId: string) => {
    return items.find(item => item.id === itemId)?.name || '알 수 없음';
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ko-KR');
  };

  return (
    <div className="transaction-history">
      <h3>최근 거래 내역</h3>
      {sortedTransactions.length === 0 ? (
        <p className="empty-state">거래 내역이 없습니다.</p>
      ) : (
        <div className="transaction-list">
          {sortedTransactions.map(transaction => (
            <div key={transaction.id} className="transaction-item">
              <div className="transaction-icon">
                {transaction.type === 'in' ? (
                  <ArrowDown className="incoming" size={20} />
                ) : (
                  <ArrowUp className="outgoing" size={20} />
                )}
              </div>
              <div className="transaction-details">
                <div className="transaction-header">
                  <span className="transaction-item-name">
                    {getItemName(transaction.itemId)}
                  </span>
                  <span className={`transaction-type ${transaction.type}`}>
                    {transaction.type === 'in' ? '입고' : '출고'}
                  </span>
                </div>
                <div className="transaction-info">
                  <span className="transaction-quantity">
                    {transaction.quantity}개
                  </span>
                  <span className="transaction-reason">{transaction.reason}</span>
                </div>
                <div className="transaction-time">{formatDate(transaction.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
