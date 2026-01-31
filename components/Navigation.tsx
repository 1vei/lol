interface NavigationProps {
  pages: { name: string }[]
  currentPage: number
  onPageChange: (index: number) => void
}

export default function Navigation({ pages, currentPage, onPageChange }: NavigationProps) {
  const canGoPrev = currentPage > 0
  const canGoNext = currentPage < pages.length - 1

  return (
    <nav className="navigation">
      <button
        className="nav-arrow"
        onClick={() => canGoPrev && onPageChange(currentPage - 1)}
        disabled={!canGoPrev}
        aria-label="Previous"
      >
        <span>←</span>
      </button>

      <div className="nav-indicator">
        {pages.map((_, index) => (
          <button
            key={index}
            className={`nav-dot ${currentPage === index ? 'active' : ''}`}
            onClick={() => onPageChange(index)}
            aria-label={`Go to ${pages[index].name}`}
          />
        ))}
      </div>

      <button
        className="nav-arrow"
        onClick={() => canGoNext && onPageChange(currentPage + 1)}
        disabled={!canGoNext}
        aria-label="Next"
      >
        <span>→</span>
      </button>

      <style jsx>{`
        .navigation {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: calc(var(--spacing) * 3);
          padding: calc(var(--spacing) * 2);
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
        }

        .nav-arrow {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: calc(var(--radius) * 0.75);
          color: var(--text-primary);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 20px;
        }

        .nav-arrow:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .nav-arrow:not(:disabled):hover span {
          transform: scale(1.2) rotate(5deg);
        }

        .nav-arrow span {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nav-indicator {
          display: flex;
          gap: calc(var(--spacing));
          align-items: center;
        }

        .nav-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--text-tertiary);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          padding: 0;
        }

        .nav-dot:hover {
          transform: scale(1.3);
        }

        .nav-dot.active {
          background: var(--accent);
          width: 24px;
          border-radius: 4px;
        }

        @media (max-width: 768px) {
          .navigation {
            padding: var(--spacing);
            gap: calc(var(--spacing) * 2);
          }

          .nav-arrow {
            width: 36px;
            height: 36px;
            font-size: 18px;
          }
        }
      `}</style>
    </nav>
  )
}
