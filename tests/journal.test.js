import { describe, it, expect } from 'vitest'
import { createJournal } from '../src/core/journal.js'

function memStorage() {
  const map = new Map()
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
  }
}

describe('journal', () => {
  it('stores lore entries newest first', () => {
    const j = createJournal(memStorage())
    j.note('蓝冻结海', '冰晶在暗面上缓慢开裂。')
    j.note('星门', '折跃至新区域。')
    const list = j.list()
    expect(list).toHaveLength(2)
    expect(list[0].title).toBe('星门')
    expect(list[1].title).toBe('蓝冻结海')
  })

  it('imports and exports payload', () => {
    const storage = memStorage()
    const j = createJournal(storage)
    j.note('A', 'one')
    const payload = j.exportPayload()
    const j2 = createJournal(memStorage())
    j2.applyImport(payload)
    expect(j2.list()[0].text).toBe('one')
  })
})
