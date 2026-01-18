import { useMemo, useState } from 'react';
import { BranchNote, User } from '../types';
import { Save } from 'lucide-react';

interface BranchNotesProps {
  currentUser: User | null;
  branches: string[];
  notes: BranchNote[];
  onSave: (note: BranchNote) => void;
}

export const BranchNotes = ({ currentUser, branches, notes, onSave }: BranchNotesProps) => {
  const isAdmin = currentUser?.role === 'admin';
  const defaultBranch = isAdmin ? branches[0] || '' : currentUser?.branchName || '';
  const [selectedBranch, setSelectedBranch] = useState(defaultBranch);
  const [draft, setDraft] = useState('');

  const selectedNote = useMemo(() => {
    return notes.find(note => note.branchName === selectedBranch);
  }, [notes, selectedBranch]);

  const handleSelectBranch = (branch: string) => {
    setSelectedBranch(branch);
    setDraft('');
  };

  const handleSave = () => {
    if (!selectedBranch) {
      alert('지점을 선택해주세요.');
      return;
    }
    const content = draft !== '' ? draft : (selectedNote?.notes || '');
    onSave({
      id: selectedBranch,
      branchName: selectedBranch,
      notes: content,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser?.username,
    });
    setDraft('');
  };

  return (
    <div className="branch-notes">
      <div className="branch-notes-header">
        <h3>지점 특이사항</h3>
        {isAdmin && (
          <select
            className="form-select"
            value={selectedBranch}
            onChange={(e) => handleSelectBranch(e.target.value)}
          >
            {branches.map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
        )}
      </div>

      <div className="branch-notes-content">
        <textarea
          className="branch-notes-textarea"
          value={draft !== '' ? draft : (selectedNote?.notes || '')}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="매대 사이즈, 제한사항, 요청사항 등 지점 특이사항을 입력하세요."
          rows={10}
        />
      </div>

      <div className="branch-notes-footer">
        <div className="branch-notes-meta">
          {selectedNote?.updatedAt && (
            <span>
              마지막 수정: {new Date(selectedNote.updatedAt).toLocaleString('ko-KR')}
              {selectedNote.updatedBy ? ` (${selectedNote.updatedBy})` : ''}
            </span>
          )}
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={16} />
          저장
        </button>
      </div>
    </div>
  );
};
