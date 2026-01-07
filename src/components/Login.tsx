import { useState, FormEvent } from 'react';
import { User } from '../types';
import { auth } from '../utils/auth';
import { Package, LogIn } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login = ({ onLogin }: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const user = await auth.login(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('사용자명 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <Package size={48} />
          <h1>KEYCAPS</h1>
          <p>재고 관리 시스템</p>
          <p>로그인하여 시작하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <div className="form-group">
            <label>사용자명</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="사용자명을 입력하세요"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary login-btn">
            <LogIn size={20} />
            로그인
          </button>

          <div className="login-info">
            <p><strong>테스트 계정:</strong></p>
            <ul>
              <li>어드민: admin / admin123</li>
              <li>직원1: 직원1 / emp123</li>
              <li>직원2: 직원2 / emp123</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
};
