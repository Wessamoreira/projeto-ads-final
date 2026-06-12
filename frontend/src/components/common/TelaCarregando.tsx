import { CircleDollarSign } from 'lucide-react'

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <div className="loading-screen__content">
        <div className="loading-screen__logo">
          <CircleDollarSign size={28} strokeWidth={1.75} />
        </div>
        <div className="loading-screen__spinner">
          <div className="spinner"></div>
        </div>
        <p className="loading-screen__text">Carregando...</p>
      </div>

      <style>{`
        .loading-screen {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-app);
          z-index: 9999;
        }

        .loading-screen__content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem;
        }

        .loading-screen__logo {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--text-primary);
          color: var(--text-inverse);
          border-radius: 10px;
        }

        .loading-screen__spinner {
          position: relative;
        }

        .spinner {
          width: 28px;
          height: 28px;
          border: 2px solid var(--border-default);
          border-top-color: var(--text-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .loading-screen__text {
          color: var(--text-muted);
          font-size: var(--font-size-sm);
          font-weight: 500;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

export default LoadingScreen
