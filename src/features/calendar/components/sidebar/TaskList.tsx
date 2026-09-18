'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { CalendarScheduleTab, CalendarTaskItem } from '../../types'

interface TaskListProps {
  tasks: CalendarTaskItem[]
  scheduleTab: CalendarScheduleTab
  /** Ids toggled away from their fixture-default `done` state (XOR semantics). */
  completedTaskIds: Set<string>
  onToggle: (id: string) => void
}

export function TaskList({ tasks, scheduleTab, completedTaskIds, onToggle }: TaskListProps) {
  const visible = scheduleTab === 'all' ? tasks : tasks.filter((t) => t.owner === scheduleTab)

  if (visible.length === 0) {
    return (
      <p className="px-1 py-4 text-center text-[11px] text-muted-foreground">
        Nothing scheduled in this view.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-1">
      {visible.map((task) => {
        const isDone = task.done !== completedTaskIds.has(task.id)
        return (
          <li key={task.id}>
            <label className="group flex cursor-pointer items-start gap-2.5 rounded-lg p-2 transition-colors hover:bg-muted/50">
              <Checkbox
                checked={isDone}
                onCheckedChange={() => onToggle(task.id)}
                className="mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <p className={cn('text-[12px] font-semibold leading-snug', isDone ? 'text-muted-foreground line-through' : 'text-foreground')}>
                  {task.title}
                </p>
                <p className="mt-0.5 truncate text-[10.5px] text-muted-foreground">{task.subtitle}</p>
              </div>
            </label>
          </li>
        )
      })}
    </ul>
  )
}
