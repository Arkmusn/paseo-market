import type { PluginSurfaceProps } from "@getpaseo/plugin/client"
import type { PluginTheme } from "@getpaseo/plugin"
import { useRpc, useSettings } from "@getpaseo/plugin/client"
import { FlatList, useToast } from "@getpaseo/plugin/client/react-native"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Pressable, Text, View } from "react-native"
import {
  countAvailableUpdates,
  directoryListRpc,
  directoryReloadRpc,
  directorySetEnabledRpc,
  directoryUninstallRpc,
  directorySettings,
  directoryUpdateRpc,
  directoryUpdateStatusRpc,
  setAutomaticUpdatePreference,
  type InstalledPlugin,
  type PluginUpdate,
} from "../shared/directory"
import { t, useMarketLocale } from "./i18n"
import { UPDATE_STATUS_QUERY_KEY } from "./update-status"
import { mutedTextColor } from "./contrast"
import { radius, space } from "./visual"

const INSTALLED_QUERY_KEY = "paseo-plugin-management-installed"
const NO_OPT_INS: readonly string[] = []

function statusLabel(status: InstalledPlugin["status"]): string {
  if (status === "running") return t().installed.running
  if (status === "failed") return t().installed.failed
  return t().installed.disabled
}

function StatusPill({
  label,
  theme,
  tone,
}: {
  label: string
  theme: PluginTheme
  tone: "success" | "danger" | "neutral" | "accent"
}) {
  const color = {
    success: theme.colors.statusSuccess,
    danger: theme.colors.statusDanger,
    neutral: theme.colors.foregroundMuted,
    accent: theme.colors.accent,
  }[tone]
  return (
    <View
      style={{
        borderColor: color,
        borderWidth: 1,
        borderRadius: radius.sm,
        paddingHorizontal: 8,
        paddingVertical: 1,
      }}
    >
      <Text style={{ color, fontSize: 11 }}>{label}</Text>
    </View>
  )
}

function AutoUpdateSwitch({
  enabled,
  disabled,
  theme,
  label,
  onPress,
}: {
  enabled: boolean
  disabled: boolean
  theme: PluginTheme
  label: string
  onPress: () => void
}) {
  const mutedOnTag = mutedTextColor(theme, theme.colors.surface2)
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: enabled, disabled }}
      aria-checked={enabled}
      disabled={disabled}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: space.sm,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text style={{ color: mutedOnTag, fontSize: 12 }}>
        {enabled ? t().installed.autoUpdateOn : t().installed.autoUpdateOff}
      </Text>
      <View
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          padding: 2,
          borderWidth: 1,
          borderColor: enabled ? theme.colors.accent : theme.colors.border,
          backgroundColor: enabled ? theme.colors.accent : theme.colors.surface2,
        }}
      >
        <View
          style={{
            width: 14,
            height: 14,
            borderRadius: 7,
            alignSelf: enabled ? "flex-end" : "flex-start",
            backgroundColor: enabled
              ? theme.colors.accentForeground
              : mutedOnTag,
          }}
        />
      </View>
    </Pressable>
  )
}

function Action({
  label,
  theme,
  onPress,
  disabled,
  tone = "neutral",
}: {
  label: string
  theme: PluginTheme
  onPress: () => void
  disabled?: boolean
  tone?: "neutral" | "success" | "danger" | "accent"
}) {
  const color =
    tone === "danger"
      ? theme.colors.statusDanger
      : tone === "success"
        ? theme.colors.statusSuccess
        : tone === "accent"
          ? theme.colors.accent
          : theme.colors.foreground
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={{
        borderColor: tone === "neutral" ? theme.colors.border : color,
        borderWidth: 1,
        borderRadius: radius.sm,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: theme.colors.surface2,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text style={{ color, fontSize: 13 }}>{label}</Text>
    </Pressable>
  )
}

export function InstalledSurface({
  theme,
  layout,
  onShowMarket,
}: PluginSurfaceProps & {
  /** Switches the shared screen back to the market. */
  onShowMarket?: () => void
}) {
  useMarketLocale()
  const settings = useSettings(directorySettings)
  const listDirectory = useRpc(directoryListRpc)
  const listUpdateStatus = useRpc(directoryUpdateStatusRpc)
  const uninstall = useRpc(directoryUninstallRpc)
  const setEnabled = useRpc(directorySetEnabledRpc)
  const reload = useRpc(directoryReloadRpc)
  const update = useRpc(directoryUpdateRpc)
  const toast = useToast()
  const queryClient = useQueryClient()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [pendingPreference, setPendingPreference] = useState<{
    installationId: string
    enabled: boolean
    attempts: number
  } | null>(null)
  const [savingPreference, setSavingPreference] = useState(false)
  const settingsValues = settings.status === "ready" ? settings.values : null
  const optIns = settingsValues?.autoUpdateOptIns ?? NO_OPT_INS

  // The preference lives in settings, so it is written once the current
  // revision is loaded and retried once after a conflict.
  useEffect(() => {
    if (
      !pendingPreference ||
      !settingsValues ||
      settings.status !== "ready" ||
      savingPreference
    ) {
      return
    }
    const pending = pendingPreference
    setSavingPreference(true)
    void settings
      .save(
        {
          ...settingsValues,
          autoUpdateOptIns: setAutomaticUpdatePreference(
            settingsValues.autoUpdateOptIns,
            pending.installationId,
            pending.enabled
          ),
        },
        settings.revision
      )
      .then((saved) => {
        if (saved) {
          setPendingPreference(null)
        } else if (pending.attempts < 1) {
          void settings.reload().finally(() =>
            setPendingPreference((current) =>
              current === pending
                ? { ...current, attempts: current.attempts + 1 }
                : current
            )
          )
        } else {
          toast.error(t().settings.saveFailed)
          setPendingPreference(null)
        }
      })
      .catch(() => {
        toast.error(t().settings.saveFailed)
        setPendingPreference(null)
      })
      .finally(() => setSavingPreference(false))
  }, [pendingPreference, savingPreference, settings, settingsValues, toast])

  const installedQuery = useQuery({
    queryKey: [INSTALLED_QUERY_KEY],
    queryFn: () => listDirectory({ force: false }),
    staleTime: 30_000,
  })
  const updateStatusQuery = useQuery({
    queryKey: UPDATE_STATUS_QUERY_KEY,
    queryFn: () => listUpdateStatus({ force: true }),
    staleTime: 60_000,
  })

  const updates = new Map(
    (updateStatusQuery.data?.updates ?? []).map((entry) => [entry.id, entry])
  )
  const installations = installedQuery.data?.installations ?? []
  const updateCount = countAvailableUpdates(updateStatusQuery.data?.updates ?? [])

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [INSTALLED_QUERY_KEY] }),
      queryClient.invalidateQueries({ queryKey: UPDATE_STATUS_QUERY_KEY }),
    ])
  }

  const run = async (
    id: string,
    operation: () => Promise<{ ok: boolean; message: string }>
  ) => {
    setBusyId(id)
    try {
      const result = await operation()
      if (result.ok) toast.show(result.message, { variant: "success" })
      else toast.error(result.message)
      await refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed")
    } finally {
      setBusyId(null)
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.surface0,
        padding: layout.compact ? 16 : 24,
      }}
    >
      {installedQuery.data && !installedQuery.data.installSupported ? (
        <Text
          accessibilityRole="alert"
          style={{
            color: theme.colors.statusWarning,
            fontSize: 12,
            paddingBottom: space.sm,
          }}
        >
          {t().installed.cliUnavailable}
        </Text>
      ) : null}

      <FlatList
        data={installations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: space.sm, paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={{ gap: space.sm, paddingBottom: space.sm }}>
            <Text role="heading" aria-level={1} style={{ color: theme.colors.foreground, fontSize: 20, lineHeight: 28, fontWeight: "600" }}>
              {t().installed.title}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, flexWrap: "wrap" }}>
              <Action
                label={t().installed.browseMarket}
                theme={theme}
                onPress={() => onShowMarket?.()}
              />
              <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12 }}>
                {t().installed.count(installations.length)}
                {updateCount > 0 ? t().installed.updatesAvailable(updateCount) : ""}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <Text
            style={{
              color: theme.colors.foregroundMuted,
              textAlign: "center",
              padding: space.lg,
            }}
          >
            {installedQuery.isLoading
              ? t().installed.reading
              : installedQuery.isError
                ? t().installed.readFailed
                : t().installed.empty}
          </Text>
        }
        renderItem={({ item }) => (
          <InstalledRow
            item={item}
            update={updates.get(item.id)}
            theme={theme}
            autoUpdate={optIns.includes(item.id)}
            autoUpdateDisabled={savingPreference || item.kind === "directory"}
            onAutoUpdate={() => {
              if (savingPreference) return
              setPendingPreference({
                installationId: item.id,
                enabled: !optIns.includes(item.id),
                attempts: 0,
              })
            }}
            busy={busyId === item.id}
            onToggle={() =>
              void run(item.id, () =>
                setEnabled({ installationId: item.id, enabled: !item.enabled })
              )
            }
            onReload={() =>
              void run(item.id, () => reload({ installationId: item.id }))
            }
            onUninstall={() =>
              void run(item.id, () => uninstall({ installationId: item.id }))
            }
            onUpdate={() =>
              void run(item.id, () => update({ installationId: item.id }))
            }
          />
        )}
      />
    </View>
  )
}

function InstalledRow({
  item,
  update,
  theme,
  autoUpdate,
  autoUpdateDisabled,
  onAutoUpdate,
  busy,
  onToggle,
  onReload,
  onUninstall,
  onUpdate,
}: {
  item: InstalledPlugin
  update?: PluginUpdate
  theme: PluginTheme
  autoUpdate: boolean
  autoUpdateDisabled: boolean
  onAutoUpdate: () => void
  busy: boolean
  onToggle: () => void
  onReload: () => void
  onUninstall: () => void
  onUpdate: () => void
}) {
  const hasUpdate = update?.outcome === "update"
  const statusTone =
    item.status === "running"
      ? "success"
      : item.status === "failed"
        ? "danger"
        : "neutral"
  return (
    <View
      style={{
        gap: space.sm,
        padding: space.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: radius.md,
        backgroundColor: theme.colors.surface1,
      }}
    >
      <View style={{ gap: 3 }}>
        <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap", alignItems: "center" }}>
          <Text style={{ color: theme.colors.foreground, fontSize: 15, fontWeight: "600" }}>
            {item.id}
          </Text>
          <StatusPill label={statusLabel(item.status)} theme={theme} tone={statusTone} />
          <StatusPill label={item.kind} theme={theme} tone="neutral" />
          {hasUpdate ? <StatusPill label={t().installed.updateAvailable} theme={theme} tone="accent" /> : null}
        </View>
        {item.revision ? (
          <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12 }}>
            {item.revision.slice(0, 12)}
          </Text>
        ) : null}
        {item.registryId ? (
          <Text style={{ color: theme.colors.foregroundMuted, fontSize: 11 }}>
            {t().installed.fromMarket(item.registryId)}
          </Text>
        ) : null}
      </View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: space.sm,
          flexWrap: "wrap",
        }}
      >
        <AutoUpdateSwitch
          enabled={autoUpdate}
          disabled={autoUpdateDisabled}
          theme={theme}
          label={`${t().installed.autoUpdate} · ${item.id}`}
          onPress={onAutoUpdate}
        />
        {item.kind === "directory" ? (
          <Text style={{ color: theme.colors.foregroundMuted, fontSize: 11 }}>
            {t().installed.autoUpdateUnsupported}
          </Text>
        ) : null}
      </View>
      <View style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}>
        <Action
          label={item.enabled ? t().common.disable : t().common.enable}
          theme={theme}
          tone={item.enabled ? "danger" : "success"}
          onPress={onToggle}
          disabled={busy}
        />
        <Action label={t().common.reload} theme={theme} onPress={onReload} disabled={busy} />
        <Action
          label={t().common.update}
          theme={theme}
          tone={hasUpdate ? "accent" : "neutral"}
          onPress={onUpdate}
          disabled={busy}
        />
        <Action label={t().common.uninstall} theme={theme} tone="danger" onPress={onUninstall} disabled={busy} />
      </View>
    </View>
  )
}