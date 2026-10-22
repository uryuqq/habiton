import { addDays, dateKey, scheduled } from '../utils/dates'
export const allDays = [0, 1, 2, 3, 4, 5, 6]
export function createDemoData() {
  const today = dateKey()
  const createdOn = addDays(today, -20)
  const habits = [
    {
      id: 'water',
      title: 'Стакан воды после пробуждения',
      note: 'Утро',
      symbol: 'water',
      time: '08:00',
      category: 'Самочувствие',
    },
    {
      id: 'reading',
      title: 'Читать 10 минут',
      note: 'Для себя',
      symbol: 'book',
      time: '09:00',
      category: 'Обучение',
    },
    {
      id: 'walk',
      title: 'Прогулка 20 минут',
      note: 'Вечер',
      symbol: 'walk',
      time: '18:00',
      category: 'Движение',
    },
    {
      id: 'sleep',
      title: 'Без телефона перед сном',
      note: 'Отдых',
      symbol: 'moon',
      time: '22:00',
      category: 'Отдых',
    },
  ].map((habit) => ({
    ...habit,
    createdOn,
    archivedOn: null,
    schedules: [{ from: createdOn, to: null, days: allDays, time: habit.time }],
  }))
  const logs = []
  for (let i = 20; i > 0; i--) {
    const date = addDays(today, -i)
    habits.forEach((habit, index) => {
      if ((i + index) % 5 !== 0 && scheduled(habit, date)) logs.push({ habitId: habit.id, date })
    })
  }
  logs.push({ habitId: 'water', date: today })
  return {
    profile: { name: 'Алексей', email: 'alex@example.com', role: 'admin' },
    habits,
    logs,
    dialogues: [],
    users: [
      { id: 'u1', email: 'alex@example.com', role: 'admin', blocked: false },
      { id: 'u2', email: 'maria@example.com', role: 'user', blocked: false },
      { id: 'u3', email: 'test@example.com', role: 'user', blocked: true },
    ],
    templates: [
      {
        id: 't1',
        title: 'Читать 10 минут',
        category: 'Обучение',
        note: 'Несколько страниц для себя',
        time: '09:00',
        days: allDays,
        active: true,
      },
      {
        id: 't2',
        title: 'Прогулка 20 минут',
        category: 'Движение',
        note: 'Небольшая пауза на свежем воздухе',
        time: '18:00',
        days: [0, 2, 4],
        active: true,
      },
    ],
    audit: [
      {
        id: 'a1',
        date: new Date().toISOString(),
        action: 'Демонстрационные данные подготовлены',
        result: 'Успешно',
      },
    ],
    instruction:
      'Предлагай 2–4 небольшие выполнимые привычки. Уточняй цель и доступное время. Не давай медицинских рекомендаций.',
  }
}
export const aiEvents = [
  { id: 'req-0142', duration: '1,8 с', status: 'Успешно' },
  { id: 'req-0141', duration: '15,0 с', status: 'Тайм-аут' },
  { id: 'req-0140', duration: '2,3 с', status: 'Успешно' },
]
export function makePlan(goal, minutes) {
  const lower = goal.toLowerCase()
  const isMove = /двиг|гуля|спорт|заряд/.test(lower)
  const isRest = /сон|спать|отдых|вечер/.test(lower)
  const titles = isMove
    ? [`Прогулка ${minutes} минут`, 'Разминка после работы', 'Подготовить одежду для прогулки']
    : isRest
      ? [
          'Без телефона перед сном',
          `Спокойное чтение ${minutes} минут`,
          'Подготовить комнату ко сну',
        ]
      : [`Читать ${minutes} минут`, 'Записать одну мысль', 'Подготовить книгу на завтра']
  return titles.map((title, index) => ({
    id: crypto.randomUUID(),
    title,
    note: 'Небольшое время для себя',
    category: isMove ? 'Движение' : isRest ? 'Отдых' : 'Обучение',
    symbol: isMove ? 'walk' : isRest ? 'moon' : 'book',
    days: allDays,
    time: ['09:00', '21:00', '22:00'][index],
    selected: index !== 2,
  }))
}
