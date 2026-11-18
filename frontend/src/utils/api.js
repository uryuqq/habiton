export const serverMode = import.meta.env.VITE_USE_BACKEND === 'true'

export async function api(action = 'state', body) {
  const response = await fetch(`/api/?action=${encodeURIComponent(action)}`, {
    ...(body === undefined
      ? {}
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Habiton': '1' },
          body: JSON.stringify(body),
        }),
    cache: 'no-store',
  })
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error('Не удалось получить ответ сервера.')
  }
  const result = await response.json()
  if (!response.ok) {
    const error = new Error(result.error || 'Сервер не смог выполнить запрос.')
    error.status = response.status
    error.dialogues = result.dialogues
    throw error
  }
  return result
}
