export function HeroGridVisual() {
  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={260}
        height={260}
        viewBox="0 0 96 96"
        aria-hidden
        className="drop-shadow-sm"
      >
        <rect width="96" height="96" rx="8" fill="none" />
        {/* Hollow grid cells */}
        {Array.from({ length: 3 }).map((_, row) =>
          Array.from({ length: 3 }).map((__, col) => {
            const x = 4 + col * 30
            const y = 4 + row * 30
            const isGold = row === 0 && col === 2
            const isSolidNavy =
              // Subtle K motif: left column and center middle cell
              (col === 0 && row !== 2) || (row === 1 && col === 1)

            if (isGold) {
              return (
                <rect
                  key={`${row}-${col}`}
                  x={x}
                  y={y}
                  width="24"
                  height="24"
                  rx="3"
                  fill="#C4AB78"
                />
              )
            }

            if (isSolidNavy) {
              return (
                <rect
                  key={`${row}-${col}`}
                  x={x}
                  y={y}
                  width="24"
                  height="24"
                  rx="3"
                  fill="#0E1C2F"
                />
              )
            }

            return (
              <rect
                key={`${row}-${col}`}
                x={x}
                y={y}
                width="24"
                height="24"
                rx="3"
                fill="none"
                stroke="#0E1C2F"
                strokeWidth="2"
                opacity="0.18"
              />
            )
          })
        )}
      </svg>
    </div>
  )
}

