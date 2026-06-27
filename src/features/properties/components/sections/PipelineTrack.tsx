import { Fragment } from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PipelineStage = 'lead' | 'qualified' | 'negotiation' | 'contract' | 'closed'

export const PIPELINE: { id: PipelineStage; label: string }[] = [
  { id: 'lead',        label: 'Lead'        },
  { id: 'qualified',   label: 'Qualified'   },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'contract',    label: 'Contract'    },
  { id: 'closed',      label: 'Closed'      },
]

export function PipelineTrack({ current }: { current: PipelineStage }) {
  const idx = PIPELINE.findIndex(s => s.id === current)
  return (
    <div>
      <div className="relative flex items-center">
        {PIPELINE.map((stage, i) => {
          const done   = i < idx
          const active = i === idx
          const isLast = i === PIPELINE.length - 1
          return (
            <Fragment key={stage.id}>
              <div className="relative z-10 flex shrink-0 items-center justify-center">
                <div className={cn(
                  'rounded-full transition-colors duration-200',
                  active
                    ? 'size-[18px] bg-primary shadow-[0_0_0_4px_rgba(0,97,188,0.12)]'
                    : done
                      ? 'size-3 bg-primary/60'
                      : 'size-3 border-2 border-border/38 bg-card',
                )}>
                  {done && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="size-1.5 text-white" />
                    </div>
                  )}
                </div>
              </div>
              {!isLast && (
                <div className={cn(
                  'h-px flex-1 transition-colors duration-300',
                  i < idx ? 'bg-primary/45' : 'bg-border/28',
                )} />
              )}
            </Fragment>
          )
        })}
      </div>
      <div className="mt-3 flex">
        {PIPELINE.map((stage, i) => (
          <div
            key={stage.id}
            className={cn(
              'flex-1 text-center',
              i === 0 && 'text-left',
              i === PIPELINE.length - 1 && 'text-right',
            )}
          >
            <span className={cn(
              'text-[9.5px] font-bold uppercase tracking-[0.12em]',
              i === idx ? 'text-primary' : i < idx ? 'text-foreground/55' : 'text-muted-foreground/42',
            )}>
              {stage.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
