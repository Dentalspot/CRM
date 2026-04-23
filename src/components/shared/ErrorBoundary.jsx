
import React from 'react';
import logger from '@/lib/utils/logger';
import { captureException } from '@/lib/sentry';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    logger.error("ErrorBoundary atrapó un error:", error, errorInfo);
    captureException(error, {
      tags: { source: 'ErrorBoundary' },
      extra: { componentStack: errorInfo?.componentStack },
      level: 'error',
    });
  }

  componentDidMount() {
    // Catch unhandled promise rejections globally to prevent white screens
    window.addEventListener('unhandledrejection', (event) => {
      // Prevent the error from crashing the app — log silently
      event.preventDefault();
      logger.warn('Unhandled promise rejection (non-blocking):', event.reason?.message || event.reason);
      captureException(event.reason instanceof Error ? event.reason : new Error(String(event.reason)), {
        tags: { source: 'unhandledrejection' },
        level: 'warning',
      });
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: '16px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          <div style={{ maxWidth: '420px', width: '100%', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '40px 32px', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px' }}>
              🔄
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>
              Algo no cargó bien
            </h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px', lineHeight: '1.5' }}>
              No te preocupes, tus datos están seguros. Intenta recargar la página.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleRetry}
                style={{ backgroundColor: '#0d9488', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
              >
                Reintentar
              </button>
              <button
                onClick={() => window.location.href = '/'}
                style={{ backgroundColor: '#f3f4f6', color: '#374151', padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}
              >
                Ir al Inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
