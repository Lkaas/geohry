import { useEffect, useState } from 'react'
import { loadWorld, type World } from './world'

/** Vrátí mapu světa, nebo null, dokud se načítá. */
export function useWorld(): World | null {
  const [world, setWorld] = useState<World | null>(null)
  useEffect(() => {
    let alive = true
    loadWorld().then((w) => {
      if (alive) setWorld(w)
    })
    return () => {
      alive = false
    }
  }, [])
  return world
}
