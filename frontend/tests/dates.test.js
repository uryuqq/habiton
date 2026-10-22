import test from 'node:test'
import assert from 'node:assert/strict'
import { addDays, dateKey, periodStats, scheduled, streak, weekday } from '../src/utils/dates.js'

const habit = {
  id: 'h1',
  createdOn: '2026-10-01',
  archivedOn: null,
  schedules: [
    { from: '2026-10-01', to: '2026-10-11', days: [0, 1, 2, 3, 4, 5, 6] },
    { from: '2026-10-12', to: null, days: [0, 2, 4] },
  ],
}
test('Дата учитывает часовой пояс и переход месяца', () => {
  assert.equal(dateKey(new Date('2026-10-21T22:00:00Z'), 'Europe/Moscow'), '2026-10-22')
  assert.equal(addDays('2026-10-01', -1), '2026-09-30')
  assert.equal(weekday('2026-10-19'), 0)
})
test('Новое расписание не меняет прошлые дни', () => {
  assert.equal(scheduled(habit, '2026-10-10'), true)
  assert.equal(scheduled(habit, '2026-10-17'), false)
  assert.equal(scheduled(habit, '2026-10-19'), true)
  assert.equal(scheduled(habit, '2026-09-30'), false)
})
test('В статистике только запланированные действия', () => {
  const logs = [
    { habitId: 'h1', date: '2026-10-12' },
    { habitId: 'h1', date: '2026-10-14' },
  ]
  assert.deepEqual(periodStats([habit], logs, '2026-10-12', '2026-10-18'), {
    planned: 3,
    completed: 2,
    percent: 67,
  })
  assert.deepEqual(periodStats([], [], '2026-10-12', '2026-10-18'), {
    planned: 0,
    completed: 0,
    percent: 0,
  })
})
test('Серия пропускает незапланированные дни', () => {
  assert.equal(
    streak(
      habit,
      [
        { habitId: 'h1', date: '2026-10-16' },
        { habitId: 'h1', date: '2026-10-19' },
      ],
      '2026-10-20',
    ),
    2,
  )
})
