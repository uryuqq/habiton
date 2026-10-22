import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

// После сборки Vite имена JS/CSS содержат хеш. Добавляем точные имена в офлайн-кеш.
export async function writeOfflineWorker(base) {
  async function files(directory) {
    const entries = await readdir(directory, { withFileTypes: true })
    const groups = await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? files(path.join(directory, entry.name))
          : [path.join(directory, entry.name)],
      ),
    )
    return groups.flat()
  }
  const output = (await files('dist')).filter((file) => !file.endsWith('sw.js'))
  const urls = output.map((file) => base + path.relative('dist', file).split(path.sep).join('/'))
  const hash = createHash('sha256')
  for (const file of output) hash.update(await readFile(file))
  const template = await readFile('public/sw.js', 'utf8')
  await writeFile(
    'dist/sw.js',
    template
      .replaceAll('__PRECACHE__', JSON.stringify(urls))
      .replaceAll('__VERSION__', hash.digest('hex').slice(0, 12))
      .replaceAll('__BASE__', base),
  )
}
