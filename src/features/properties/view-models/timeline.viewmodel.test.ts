import { describe, it, expect } from 'vitest'
import { buildTimelineViewModel } from './timeline.viewmodel'
import { buildProperty } from '@/test/builders/property'
import i18n from '@/i18n/config'

// Enterprise 100% Data Certification (2026-07-23) — Rules 3 & 4.
//
// Enterprise Localization pass (2026-07-24): buildTimelineViewModel now
// takes a real `t` (see that file's own note on why — composed narrative
// sentences can't be split into "translatable" and "real data" after the
// fact). Tests use the app's actual i18n instance, fixed to English, so
// assertions exercise the real translation keys end-to-end — a missing or
// misspelled key fails these tests exactly like it would fail in the app.
const t = i18n.getFixedT('en', 'properties')
const build = (
  property: Parameters<typeof buildTimelineViewModel>[0],
  calls: Parameters<typeof buildTimelineViewModel>[1] = [],
  meetings: Parameters<typeof buildTimelineViewModel>[2] = [],
  tasks: Parameters<typeof buildTimelineViewModel>[3] = [],
) => buildTimelineViewModel(property, calls, meetings, tasks, t)

describe('buildTimelineViewModel — null/edge cases (Rule 3)', () => {
  it('minimal property, no activity: only the always-present "Property Registry" event, no crash', () => {
    const vm = build(buildProperty({}))
    expect(vm.events).toHaveLength(1)
    expect(vm.events[0].id).toBe('listing-created')
    expect(vm.hasRealActivity).toBe(false)
  })

  it('assignedUserName absent: no "agent-assigned" event synthesized (not a blank/undefined-titled event)', () => {
    const vm = build(buildProperty({ assignedUserName: undefined }))
    expect(vm.events.find(e => e.id === 'agent-assigned')).toBeUndefined()
  })

  it('imagesIds empty: no "gallery-published" event synthesized', () => {
    const vm = build(buildProperty({ imagesIds: [] }))
    expect(vm.events.find(e => e.id === 'gallery-published')).toBeUndefined()
  })

  it('propertyCode absent: "listing-created" event still renders, just without a meta row', () => {
    const vm = build(buildProperty({ propertyCode: undefined }))
    const event = vm.events.find(e => e.id === 'listing-created')!
    expect(event).toBeDefined()
    expect(event.meta).toBeUndefined()
  })

  it('price absent on the agent event: meta is undefined, not a "€undefined" string', () => {
    const vm = build(buildProperty({ assignedUserName: 'Agent', price: undefined }))
    const event = vm.events.find(e => e.id === 'agent-assigned')!
    expect(event.meta).toBeUndefined()
  })

  it('createdAt/modifiedAt both absent: no crash on relative-time/epoch formatting', () => {
    expect(() => build(buildProperty({ createdAt: undefined, modifiedAt: undefined })))
      .not.toThrow()
  })

  it('task with no dateEnd: time is empty string, not "Due Invalid Date"', () => {
    const vm = build(buildProperty({}), [], [], [
      { id: 't1', name: 'Follow up', status: 'Not Started', dateEnd: null },
    ])
    const taskEvent = vm.events.find(e => e.id === 'task-t1')!
    expect(taskEvent.time).toBe('')
  })
})

describe('buildTimelineViewModel — conditional branch matrix / media pluralization (Rule 4)', () => {
  it('exactly 1 photo: singular "1 photo attached", not "1 photos"', () => {
    const vm = build(buildProperty({ imagesIds: ['only-one'] }))
    const event = vm.events.find(e => e.id === 'gallery-published')!
    expect(event.content).toContain('1 photo attached')
    expect(event.content).not.toContain('1 photos')
    expect(event.meta!.value).toBe('1 photo')
  })

  it('multiple photos: plural "N photos attached"', () => {
    const vm = build(buildProperty({ imagesIds: ['a', 'b', 'c'] }))
    const event = vm.events.find(e => e.id === 'gallery-published')!
    expect(event.content).toContain('3 photos attached')
    expect(event.meta!.value).toBe('3 photos')
  })

  it('hasRealActivity: false with all 3 arrays empty, true if any one has an entry', () => {
    expect(build(buildProperty({})).hasRealActivity).toBe(false)
    expect(build(buildProperty({}),
      [{ id: 'c1', name: 'Call', status: 'Held', dateStart: null }]).hasRealActivity).toBe(true)
  })

  it('real activity events (call/meeting/task) all merge with synthesized lifecycle events into one list', () => {
    const vm = build(
      buildProperty({ assignedUserName: 'Agent' }),
      [{ id: 'c1', name: 'Intro Call', status: 'Held', dateStart: '2026-01-01' }],
      [{ id: 'm1', name: 'Viewing', status: 'Held', dateStart: '2026-01-02', dateEnd: '2026-01-02' }],
      [{ id: 't1', name: 'Send Contract', status: 'Not Started', dateEnd: '2026-01-05' }],
    )
    const ids = vm.events.map(e => e.id)
    expect(ids).toEqual(expect.arrayContaining(['agent-assigned', 'listing-created', 'call-c1', 'meeting-m1', 'task-t1']))
  })

  it('events are sorted most-recent-first by timestamp — proven with distinct, ordered dates', () => {
    const vm = build(
      buildProperty({ createdAt: '2020-01-01' }),
      [{ id: 'c1', name: 'Old Call', status: 'Held', dateStart: '2019-01-01' }],
      [], [{ id: 't1', name: 'Newest Task', status: 'Not Started', dateEnd: '2026-01-01' }],
    )
    const timestamps = vm.events.map(e => e.timestamp)
    const sorted = [...timestamps].sort((a, b) => b - a)
    expect(timestamps).toEqual(sorted)
    expect(vm.events[0].id).toBe('task-t1') // the newest date must be first
  })

  it('call event includes direction when present, omits the separator when absent', () => {
    const withDirection = build(buildProperty({}),
      [{ id: 'c1', name: 'Call', status: 'Held', dateStart: null, direction: 'Outbound' }])
    const withoutDirection = build(buildProperty({}),
      [{ id: 'c2', name: 'Call', status: 'Held', dateStart: null }])
    // Index into the merged/sorted list by id, not position — the always-
    // present "listing-created" event is also in this list and its sort
    // position relative to a null-dateStart call event is not what this
    // test is about.
    expect(withDirection.events.find(e => e.id === 'call-c1')!.content).toBe('Held · Outbound')
    expect(withoutDirection.events.find(e => e.id === 'call-c2')!.content).toBe('Held')
  })
})
