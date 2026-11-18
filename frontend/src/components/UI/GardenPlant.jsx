import s from './UI.module.css'

export function GardenPlant({ xp, small = false }) {
  const growth = 0.55 + 0.45 * Math.min(xp / 450, 1)
  return (
    <svg
      className={small ? s.plantSmall : s.plant}
      width="140"
      height="150"
      viewBox="0 0 140 150"
      fill="none"
      role="img"
      aria-label="Растение в горшке"
    >
      <path
        opacity="0.1"
        d="M70.6 141.6C93.4646 141.6 112 138.914 112 135.6C112 132.286 93.4646 129.6 70.6 129.6C47.7354 129.6 29.2 132.286 29.2 135.6C29.2 138.914 47.7354 141.6 70.6 141.6Z"
        fill="#356448"
      />
      <g className={s.plantGrowth} style={{ '--plant-growth': growth }}>
        <g className={s.plantSway}>
          <path
            d="M70 102C67.6 76.8 69.4 57 73.6 33.6"
            strokeWidth="2.4"
            strokeLinecap="round"
            stroke="#709A62"
          />
          <path
            d="M71.8 55.2C53.8 50.4 46.6 38.4 52 25.2C69.4 28.2 80.2 40.2 71.8 55.2Z"
            fill="#A8C484"
          />
          <path
            d="M70 73.2C80.8 52.8 97.6 46.2 109 52.2C106 68.4 92.8 77.4 70 73.2Z"
            fill="#709A62"
          />
          <path
            d="M69.4 89.4C51.4 75 36.4 74.4 27.4 84.6C37.6 98.4 54.4 101.4 69.4 89.4Z"
            fill="#709A62"
          />
          <path
            d="M71.2 97.8C79.6 82.8 94 77.4 104.8 82.8C99.4 96 86.8 102 71.2 97.8Z"
            fill="#A8C484"
          />
          <path
            d="M73.6 40.8C79 23.4 86.8 15.6 97.6 15.6C100.6 30 89.8 41.4 73.6 40.8Z"
            fill="#A8C484"
          />
        </g>
      </g>
      <path
        d="M43.6 103.8L49.6 129.6C50.8 135 59.2 138 70.6 138C82 138 89.8 135 91.6 129.6L97.6 103.8H43.6Z"
        fill="#C28262"
      />
      <path
        d="M70.6 110.4C85.5117 110.4 97.6 107.445 97.6 103.8C97.6 100.155 85.5117 97.2 70.6 97.2C55.6883 97.2 43.6 100.155 43.6 103.8C43.6 107.445 55.6883 110.4 70.6 110.4Z"
        fill="#C28262"
      />
      <path
        d="M70.6 108C82.5294 108 92.2 106.12 92.2 103.8C92.2 101.48 82.5294 99.6 70.6 99.6C58.6706 99.6 49 101.48 49 103.8C49 106.12 58.6706 108 70.6 108Z"
        fill="#685343"
      />
      <path d="M70.6 103.8V94.2" strokeWidth="2.4" strokeLinecap="round" stroke="#709A62" />
      <g opacity="0.24">
        <path d="M52.6 115.2L55.6 128.4Z" fill="black" />
        <path d="M52.6 115.2L55.6 128.4" strokeWidth="1.2" strokeLinecap="round" stroke="white" />
      </g>
    </svg>
  )
}
