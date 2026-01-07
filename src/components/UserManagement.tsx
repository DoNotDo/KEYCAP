import { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { auth } from '../utils/auth';
import { Plus, Edit, Trash2, X } from 'lucide-react';

interface UserManagementProps {
  onClose: () => void;
  onUpdate: () => void;
}

export const UserManagement = ({ onClose, onUpdate }: UserManagementProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'employee' as UserRole,
    branchName: '',
    status: 'active' as 'active' | 'inactive',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const users = await auth.getUsers();
    setUsers(users);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        await auth.updateUser(editingUser.id, formData);
      } else {
        await auth.addUser(formData);
      }
      
      await loadUsers();
      setShowForm(false);
      setEditingUser(undefined);
      setFormData({
        username: '',
        password: '',
        role: 'employee',
        branchName: '',
        status: 'active',
      });
      onUpdate();
    } catch (error) {
      console.error('사용자 저장 오류:', error);
      alert('사용자 저장 중 오류가 발생했습니다.');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '', // 비밀번호는 표시하지 않음
      role: user.role,
      branchName: user.branchName || '',
      status: user.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (userId: string) => {
    if (confirm('이 사용자를 삭제하시겠습니까?')) {
      try {
        await auth.deleteUser(userId);
        await loadUsers();
        onUpdate();
      } catch (error) {
        console.error('사용자 삭제 오류:', error);
        alert('사용자 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  useEffect(() => {
    const loadCurrentUser = async () => {
      const user = await auth.getCurrentUser();
      setCurrentUser(user);
    };
    loadCurrentUser();
  }, []);

  const canDelete = (user: User) => user.id !== currentUser?.id;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2>계정 관리</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="user-management-content">
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingUser(undefined);
              setFormData({
                username: '',
                password: '',
                role: 'employee',
                branchName: '',
                status: 'active',
              });
              setShowForm(true);
            }}
            style={{ marginBottom: '20px' }}
          >
            <Plus size={18} />
            새 계정 추가
          </button>

          {showForm && (
            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-row">
                <div className="form-group">
                  <label>사용자명 *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                    disabled={!!editingUser}
                  />
                </div>
                <div className="form-group">
                  <label>비밀번호 {editingUser ? '(변경 시에만 입력)' : '*'}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>권한 *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="form-select"
                    required
                  >
                    <option value="employee">직원</option>
                    <option value="admin">어드민</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>지점명 {formData.role === 'employee' ? '*' : '(직원만)'}</label>
                  <input
                    type="text"
                    value={formData.branchName}
                    onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                    required={formData.role === 'employee'}
                    disabled={formData.role === 'admin'}
                    placeholder={formData.role === 'admin' ? '어드민은 지점 없음' : '예: 강남점'}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>상태 *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="form-select"
                  required
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                  취소
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? '수정' : '추가'}
                </button>
              </div>
            </form>
          )}

          <div className="user-table-container">
            <table className="user-table">
              <thead>
                <tr>
                  <th>사용자명</th>
                  <th>권한</th>
                  <th>지점</th>
                  <th>상태</th>
                  <th>작업</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role === 'admin' ? '어드민' : '직원'}
                      </span>
                    </td>
                    <td>{user.branchName || '-'}</td>
                    <td>
                      <span className={`status-badge ${user.status}`}>
                        {user.status === 'active' ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEdit(user)}
                          className="icon-btn"
                          title="수정"
                        >
                          <Edit size={18} />
                        </button>
                        {canDelete(user) && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="icon-btn danger"
                            title="삭제"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
