'use client'

export default function MusicPlayer() {
  return (
    <div className="music-player">
      <div className="music-widget">
        <svg viewBox="0 0 24 24" fill="currentColor" className="music-icon">
          <path d="M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043C21.003.517 20.373.285 19.7.164c-.517-.093-1.038-.135-1.564-.15-.04-.003-.083-.01-.124-.013H5.988c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208c-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03c.525 0 1.048-.034 1.57-.1.823-.106 1.597-.35 2.296-.81a5.28 5.28 0 0 0 1.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.045-1.773-.6-1.943-1.536-.142-.773.227-1.624 1.038-2.022.323-.16.67-.25 1.018-.324.378-.082.758-.153 1.134-.24.274-.063.457-.23.51-.516.014-.063.02-.13.02-.193 0-1.815 0-3.63-.002-5.443 0-.062-.01-.125-.026-.185-.04-.15-.15-.243-.304-.234-.16.01-.318.035-.475.066-.76.15-1.52.303-2.28.456l-2.325.47-1.374.278c-.016.003-.032.01-.048.013-.277.077-.377.203-.39.49-.002.042 0 .086 0 .13-.002 2.602 0 5.204-.003 7.805 0 .42-.047.836-.215 1.227-.278.64-.77 1.04-1.434 1.233-.35.1-.71.16-1.075.172-.96.036-1.755-.6-1.92-1.544-.14-.812.23-1.685 1.154-2.075.357-.15.73-.232 1.108-.31.287-.06.575-.116.86-.177.383-.083.583-.323.6-.714v-.15c0-2.96 0-5.922.002-8.882 0-.123.013-.25.042-.37.07-.285.273-.448.546-.518.255-.066.515-.112.774-.165.733-.15 1.466-.296 2.2-.444l2.27-.46c.67-.134 1.34-.27 2.01-.403.22-.043.442-.088.663-.106.31-.025.523.17.554.482.008.073.012.148.012.223.002 1.91.002 3.822 0 5.732z" />
        </svg>
        <span className="music-text">this my playlist</span>
      </div>
      <iframe
        allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
        className="music-iframe"
        sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
        src="https://embed.music.apple.com/us/album/october-rust/214478798?l=en-GB&app=music"
      />

      <style jsx>{`
        .music-player {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          position: relative;
        }

        .music-widget {
          display: flex;
          align-items: center;
          gap: calc(var(--spacing));
          padding: calc(var(--spacing) * 1.5) calc(var(--spacing) * 2);
          background: var(--bg-secondary);
          border-radius: calc(var(--radius) * 0.75);
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .music-widget:hover {
          background: var(--bg-tertiary);
        }

        .music-icon {
          width: 20px;
          height: 20px;
          color: var(--accent);
        }

        .music-text {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .music-player :global(.music-iframe) {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 500px;
          height: 52px;
          overflow: hidden;
          border-radius: calc(var(--radius) * 0.5);
          border: none;
          opacity: 0;
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: -1;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .music-player :global(.music-iframe)::-webkit-scrollbar {
          display: none;
        }

        .music-player:hover .music-widget {
          opacity: 0;
          pointer-events: none;
        }

        .music-player:hover :global(.music-iframe) {
          height: 450px;
          opacity: 1;
          pointer-events: auto;
          box-shadow: var(--shadow-lg);
          z-index: 1000;
        }

        @media (max-width: 768px) {
          .music-player {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
