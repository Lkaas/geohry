// Země, které jsou v dané den hledané v hrách s denní výzvou. Vlajka dne se jim vyhýbá, aby nic neprozradila.
import { pickTarget as border } from '../games/border/logic'
import { pickTarget as countryle } from '../games/countryle/logic'
import { pickTarget as flagClues } from '../games/flagclues/logic'
import { pickTarget as mystery } from '../games/mystery/logic'
import { pickTarget as neighbors } from '../games/neighbors/logic'
import { pickTarget as silhouette } from '../games/silhouette/logic'

export function dailyAnswers(dateKey: string): Set<string> {
  return new Set([border, countryle, flagClues, mystery, neighbors, silhouette].map((pick) => pick('daily', dateKey)))
}
