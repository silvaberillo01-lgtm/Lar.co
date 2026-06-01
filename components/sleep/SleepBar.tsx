'use client'
import { useSleep } from '@/lib/hooks/useSleep'
import { sleepDuration, fmtDur } from '@/lib/utils/time'

interface SleepBarProps {
  profileId: string | null
}

export function SleepBar({ profileId }: SleepBarProps) {
  const { sleepLog, upsert } = useSleep(profileId)

  const duration = sleepLog?.sleep_time && sleepLog?.wake_time
    ? sleepDuration(sleepLog.sleep_time, sleepLog.wake_time)
    : null

  return (
    <div className="bg-surface rounded-2xl px-4 py-3 flex items-center gap-4">
      <span className="text-lg">😴</span>
      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted">Dormiu</span>
          <input
            type="time"
            defaultValue={sleepLog?.sleep_time?.slice(0, 5) ?? ''}
            onBlur={e => upsert({ sleep_time: e.target.value })}
            className="text-sm font-medium bg-transparent border-b border-surface2 focus:outline-none focus:border-accent px-1 py-0.5 w-16"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted">Acordou</span>
          <input
            type="time"
            defaultValue={sleepLog?.wake_time?.slice(0, 5) ?? ''}
            onBlur={e => upsert({ wake_time: e.target.value })}
            className="text-sm font-medium bg-transparent border-b border-surface2 focus:outline-none focus:border-accent px-1 py-0.5 w-16"
          />
        </div>
      </div>
      {duration !== null && (
        <span className="text-sm font-semibold text-mateus">{fmtDur(duration)}</span>
      )}
    </div>
  )
}
