import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          backgroundColor: '#f8f9fa',
        }}>
          <h1 style={{ color: '#f56565', marginBottom: '16px' }}>오류가 발생했습니다</h1>
          <p style={{ color: '#5f6368', marginBottom: '24px' }}>
            {this.state.error?.message || '알 수 없는 오류가 발생했습니다.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#1a73e8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            페이지 새로고침
          </button>
          <details style={{ marginTop: '24px', maxWidth: '800px' }}>
            <summary style={{ cursor: 'pointer', color: '#5f6368' }}>오류 상세 정보</summary>
            <pre style={{
              marginTop: '12px',
              padding: '16px',
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              overflow: 'auto',
              fontSize: '12px',
            }}>
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}
