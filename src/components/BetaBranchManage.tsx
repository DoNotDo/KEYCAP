import { useState } from 'react';
import { BetaBranch } from '../types';
import { storage } from '../utils/storage';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface BetaBranchManageProps {
  branches: BetaBranch[];
}

export function BetaBranchManage({ branches }: BetaBranchManageProps) {
  const [editing, setEditing] = useState<BetaBranch | null>(null);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [order, setOrder] = useState(0);

  const isDuplicateName = (newName: string, excludeId?: string) => {
    const n = newName.trim().toLowerCase();
    if (!n) return false;
    return branches.some(b => b.id !== excludeId && b.name.trim().toLowerCase() === n);
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    const newName = (name || editing.name).trim();
    if (!newName) return;
    if (isDuplicateName(newName, editing.id)) {
      alert('이미 같은 이름의 지점이 있습니다.');
      return;
    }
    await storage.updateBetaBranch(editing.id, { name: newName, order });
    setEditing(null);
    setName('');
  };

  const handleAdd = async () => {
    const newName = name.trim();
    if (!newName) return;
    if (isDuplicateName(newName)) {
      alert('이미 같은 이름의 지점이 있습니다.');
      return;
    }
    await storage.addBetaBranch({ name: newName, order: branches.length, active: true });
    setAdding(false);
    setName('');
    setOrder(branches.length);
  };

  const handleDelete = async (b: BetaBranch) => {
    if (!confirm(`"${b.name}" 지점을 삭제할까요?`)) return;
    await storage.deleteBetaBranch(b.id);
  };

  const handleToggleActive = async (b: BetaBranch) => {
    await storage.updateBetaBranch(b.id, { active: !b.active });
  };

  return (
    <div className="beta-manage beta-branch-manage">
      <h3>지점 관리</h3>
      <p className="beta-manage-desc">지점을 추가·수정·삭제하면 각 지점 보고 화면에 바로 반영됩니다.</p>
      <div className="beta-manage-actions">
        <button type="button" className="btn btn-primary" onClick={() => { setAdding(true); setName(''); setOrder(branches.length); }}>
          <Plus size={18} /> 지점 추가
        </button>
      </div>
      {adding && (
        <div className="beta-manage-form">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="지점명" />
          <button type="button" className="btn btn-primary" onClick={handleAdd}>저장</button>
          <button type="button" className="btn btn-secondary" onClick={() => setAdding(false)}>취소</button>
        </div>
      )}
      <div className="beta-manage-table-wrap">
        <table className="beta-manage-table">
          <thead>
            <tr>
              <th>순서</th>
              <th>지점명</th>
              <th>상태</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.id}>
                <td>{b.order + 1}</td>
                <td>
                  {editing?.id === b.id ? (
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder={b.name} autoFocus />
                  ) : (
                    b.name
                  )}
                </td>
                <td>
                  {editing?.id === b.id ? null : (
                    <button type="button" className={`btn btn-small ${b.active ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleToggleActive(b)}>
                      {b.active ? '활성' : '비활성'}
                    </button>
                  )}
                </td>
                <td>
                  {editing?.id === b.id ? (
                    <>
                      <button type="button" className="btn btn-primary btn-small" onClick={handleSaveEdit}>확인</button>
                      <button type="button" className="btn btn-secondary btn-small" onClick={() => { setEditing(null); setName(''); }}>취소</button>
                    </>
                  ) : (
                    <>
                      <button type="button" className="btn btn-secondary btn-small" onClick={() => { setEditing(b); setName(b.name); setOrder(b.order); }}><Pencil size={14} /></button>
                      <button type="button" className="btn btn-secondary btn-small" onClick={() => handleDelete(b)}><Trash2 size={14} /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
