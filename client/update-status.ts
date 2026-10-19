import type { InstalledPlugin, PluginUpdate } from "../shared/directory"
import { t } from "./i18n"

/**
 * The surface and the sidebar badge read the same query, so a check made by
 * either one fills the other's cache (the plugin's query client is shared).
 * Update status is about the daemon's installed plugins, not a registry, so
 * the key does not vary with the registry URL.
 */
export const UPDATE_STATUS_QUERY_KEY = ["paseo-plugin-management-update-status"] as const

/** Whether any of these installations has an update the user can apply. */
export function hasAvailableUpdate(
  installations: readonly Pick<InstalledPlugin, "id">[],
  updates: ReadonlyMap<string, Pick<PluginUpdate, "outcome">>
): boolean {
  return installations.some(
    (installation) => updates.get(installation.id)?.outcome === "update"
  )
}

export interface AutomaticUpdateSummary {
  /** Only failures are errors: a skipped plugin has automatic updates off by choice. */
  failed: boolean
  message: string
}

/** The toast text for a "Run now" pass over every installed plugin. */
export function summarizeAutomaticUpdates(
  outcomes: readonly { status: string; message?: string }[]
): AutomaticUpdateSummary {
  const updated = outcomes.filter((o) => o.status === "updated").length
  const failures = outcomes.filter((o) => o.status === "failed")
  const skipped = outcomes.filter((o) => o.status === "skipped").length
    const skippedNote = skipped > 0 ? t().updates.skipped(skipped) : ""
  if (failures.length > 0) {
    const first = failures[0]?.message
    return {
      failed: true,
      message: `${t().updates.updatedClause(updated)}; ${t().updates.failedClause(
        failures.length
      )}.${skippedNote}${first ? ` ${first}` : ""}`,
    }
  }
  return {
    failed: false,
    message: `${
      updated > 0 ? `${t().updates.updatedClause(updated)}.` : t().updates.none
    }${skippedNote}`,
  }
}
