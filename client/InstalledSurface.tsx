import type { PluginSurfaceProps } from "@getpaseo/plugin/client"
import type { PluginTheme } from "@getpaseo/plugin"
import { useRpc, useSettings } from "@getpaseo/plugin/client"
import { FlatList, useToast } from "@getpaseo/plugin/client/react-native"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Pressable, Text, View } from "react-native"
import {
  countAvailableUpdates,
  directoryHostPluginsRpc,
  directoryListRpc,
  directoryReloadRpc,
  directorySetEnabledRpc,
  directoryUninstallRpc,
  directorySettings,
  directoryUpdateRpc,
  directoryUpdateStatusRpc,
  type InstalledPlugin,
  type PluginUpdate,
  type RemoteHost,
} from "../shared/directory"
import { t, useMarketLocale } from "./i18n"
import { UPDATE_STATUS_QUERY_KEY } from "./update-status"
import { radius, space } from "./visual"

const INSTALLED_QUERY_KEY = "paseo-plugin-management-installed"
const HOST_PLUGINS_QUERY_KEY = "paseo-plugin-management-host-plugins"
const NO_HOSTS: readonly RemoteHost[] = []

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

function HostChip({
  label,
  selected,
  theme,
  onPress,
}: {
  label: string
  selected: boolean
  theme: PluginTheme
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        borderColor: selected ? theme.colors.accent : theme.colors.border,
        borderWidth: 1,
        borderRadius: radius.sm,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: selected ? theme.colors.surface2 : theme.colors.surface1,
      }}
    >
      <Text
        style={{
          color: selected ? theme.colors.accent : theme.colors.foreground,
          fontSize: 12,
        }}
      >
        {label}
      </Text>
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
  const listHostPlugins = useRpc(directoryHostPluginsRpc)
  const listUpdateStatus = useRpc(directoryUpdateStatusRpc)
  const uninstall = useRpc(directoryUninstallRpc)
  const setEnabled = useRpc(directorySetEnabledRpc)
  const reload = useRpc(directoryReloadRpc)
  const update = useRpc(directoryUpdateRpc)
  const toast = useToast()
  const queryClient = useQueryClient()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [hostId, setHostId] = useState<string | null>(null)
  const hosts: readonly RemoteHost[] =
    settings.status === "ready" ? settings.values.remoteHosts : NO_HOSTS

  // A removed host must not leave the screen on a dead selection.
  useEffect(() => {
    if (hostId && !hosts.some((host) => host.id === hostId)) setHostId(null)
  }, [hostId, hosts])

  const selectedHost = hosts.find((host) => host.id === hostId)
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
  const hostPluginsQuery = useQuery({
    queryKey: [HOST_PLUGINS_QUERY_KEY, hostId],
    queryFn: () => listHostPlugins({ hostId: hostId as string }),
    enabled: hostId !== null,
    staleTime: 30_000,
  })
  const hostUpdateStatusQuery = useQuery({
    queryKey: [...UPDATE_STATUS_QUERY_KEY, hostId],
    queryFn: () => listUpdateStatus({ force: true, hostId }),
    enabled: hostId !== null,
    staleTime: 60_000,
  })

  const readOnly = selectedHost !== undefined
  const activeUpdates = readOnly
    ? (hostUpdateStatusQuery.data?.updates ?? [])
    : (updateStatusQuery.data?.updates ?? [])
  const updates = new Map(activeUpdates.map((entry) => [entry.id, entry]))
  const installations = readOnly
    ? (hostPluginsQuery.data?.installations ?? [])
    : (installedQuery.data?.installations ?? [])
  const updateCount = countAvailableUpdates(activeUpdates)
  const reading = readOnly ? hostPluginsQuery.isLoading : installedQuery.isLoading
  const remoteError = readOnly
    ? hostPluginsQuery.data?.error ??
      (hostPluginsQuery.isError ? String(hostPluginsQuery.error) : undefined)
    : undefined

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [INSTALLED_QUERY_KEY] }),
      queryClient.invalidateQueries({ queryKey: UPDATE_STATUS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: [HOST_PLUGINS_QUERY_KEY] }),
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
            {hosts.length > 0 ? (
              <View
                accessibilityLabel={t().installed.hostPicker}
                style={{ flexDirection: "row", gap: space.sm, flexWrap: "wrap" }}
              >
                <HostChip
                  label={t().installed.thisHost}
                  selected={!readOnly}
                  theme={theme}
                  onPress={() => setHostId(null)}
                />
                {hosts.map((host) => (
                  <HostChip
                    key={host.id}
                    label={host.label || host.endpoint}
                    selected={host.id === hostId}
                    theme={theme}
                    onPress={() => setHostId(host.id)}
                  />
                ))}
              </View>
            ) : null}
            {readOnly && selectedHost ? (
              <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12 }}>
                {t().installed.readOnly} · {selectedHost.endpoint}
              </Text>
            ) : null}
            {readOnly ? (
              <Text style={{ color: theme.colors.foregroundMuted, fontSize: 12 }}>
                {t().installed.remoteReadOnly}
              </Text>
            ) : null}
            {remoteError ? (
              <Text
                accessibilityRole="alert"
                style={{ color: theme.colors.statusDanger, fontSize: 12 }}
              >
                {t().installed.remoteFailed(remoteError)}
              </Text>
            ) : null}
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
            {reading
              ? t().installed.reading
              : readOnly
                ? t().installed.empty
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
            readOnly={readOnly}
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
  readOnly,
  busy,
  onToggle,
  onReload,
  onUninstall,
  onUpdate,
}: {
  item: InstalledPlugin
  update?: PluginUpdate
  theme: PluginTheme
  readOnly: boolean
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
      {readOnly ? null : (
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
      )}
    </View>
  )
}