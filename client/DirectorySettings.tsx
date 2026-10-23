import { useRpc, useSettings } from "@getpaseo/plugin/client"
import { useToast } from "@getpaseo/plugin/client/react-native"
import type { PluginSurfaceProps } from "@getpaseo/plugin/client"
import type { PluginTheme } from "@getpaseo/plugin"
import {
  SettingsAction,
  SettingsCard,
  SettingsInput,
  SettingsRow,
  SettingsSection,
} from "@getpaseo/plugin/client/ui"
import { useMemo, useState } from "react"
import { Pressable, Text, View } from "react-native"
import {
  AUTO_UPDATE_INTERVAL,
  clampIntervalMinutes,
  DEFAULT_SOURCES,
  directoryRunAutomaticUpdatesRpc,
  directorySettings,
  isTrustedRegistryUrl,
  type MarketSource,
  MARKET_LANGUAGES,
  registryBase,
  SOURCE_KIND_LABELS,
  SOURCE_KINDS,
  type MarketLanguage,
  type SourceKind,
} from "../shared/directory"
import { t, useMarketLocale } from "./i18n"
import { summarizeAutomaticUpdates } from "./update-status"

function sourcesInfo(): string {
  return t().settings.info
}

const LANGUAGE_LABELS: Record<MarketLanguage, string> = {
  auto: "",
  en: "English",
  zh: "中文",
}

function languageLabel(language: MarketLanguage): string {
  return language === "auto"
    ? t().settings.languageAuto
    : LANGUAGE_LABELS[language]
}

/** 该源实际会被读取的地址，用来在输入框下实时展示解析结果。 */
function readTarget(base: string, kind: SourceKind): string {
  if (kind === "paseo-cafe") return `${base}/api/plugins`
  return `${base}/index.json`
}

function kindHints(): Record<SourceKind, string> {
  return {
    "paseo-registry": t().settings.kindRegistry,
    "paseo-cafe": t().settings.kindCafe,
    "custom-json": t().settings.kindCustom,
  }
}

function slugify(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return slug || "source"
}

function KindChips({
  theme,
  value,
  onChange,
  disabled,
}: {
  theme: PluginTheme
  value: SourceKind
  onChange: (kind: SourceKind) => void
  disabled: boolean
}) {
  return (
    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
      {SOURCE_KINDS.map((kind) => {
        const selected = kind === value
        return (
          <Pressable
            key={kind}
            accessibilityRole="button"
            accessibilityLabel={SOURCE_KIND_LABELS[kind]}
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(kind)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: selected ? theme.colors.accent : theme.colors.border,
              backgroundColor: selected
                ? theme.colors.accent
                : theme.colors.surface2,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <Text
              style={{
                color: selected
                  ? theme.colors.accentForeground
                  : theme.colors.foreground,
                fontSize: 13,
              }}
            >
              {SOURCE_KIND_LABELS[kind]}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function LanguageChips({
  theme,
  value,
  onChange,
  disabled,
}: {
  theme: PluginTheme
  value: MarketLanguage
  onChange: (language: MarketLanguage) => void
  disabled: boolean
}) {
  return (
    <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
      {MARKET_LANGUAGES.map((language) => {
        const selected = language === value
        const label = languageLabel(language)
        return (
          <Pressable
            key={language}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected, disabled }}
            disabled={disabled}
            onPress={() => onChange(language)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: selected ? theme.colors.accent : theme.colors.border,
              backgroundColor: selected
                ? theme.colors.accent
                : theme.colors.surface2,
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <Text
              style={{
                color: selected
                  ? theme.colors.accentForeground
                  : theme.colors.foreground,
                fontSize: 13,
              }}
            >
              {label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

export function DirectorySettings({
  theme,
  layout: _layout,
  embedded = false,
}: PluginSurfaceProps & {
  /** 在弹窗里复用时不再套一层设置分区。 */
  embedded?: boolean
}) {
  useMarketLocale()
  const settings = useSettings(directorySettings)
  const runAutomaticUpdates = useRpc(directoryRunAutomaticUpdatesRpc)
  const toast = useToast()
  const [draftKind, setDraftKind] = useState<SourceKind>("paseo-registry")
  const [draftName, setDraftName] = useState("")
  const [draftUrl, setDraftUrl] = useState("")
  const resolvedBase = draftUrl.trim()
    ? registryBase(draftUrl.trim())
    : ""
  const [busy, setBusy] = useState(false)
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  const [intervalDraft, setIntervalDraft] = useState<string | null>(null)

  const sources = useMemo(
    () => (settings.status === "ready" ? settings.values.sources : []),
    [settings]
  )

  if (settings.status === "loading") return null

  if (settings.status === "error" || settings.status === "invalid") {
    const failure = (
      <SettingsCard>
        <SettingsRow label={t().settings.sources} error={settings.error} />
        <SettingsAction
          label={t().settings.tryAgain}
          actionLabel={t().common.reload}
          onPress={settings.reload}
        />
        {settings.status === "invalid" ? (
          <SettingsAction
            label={t().settings.restoreDefaultSettings}
            actionLabel={t().common.reset}
            onPress={() => void settings.reset()}
          />
        ) : null}
      </SettingsCard>
    )
    return embedded ? (
      failure
    ) : (
      <SettingsSection title={t().settings.section}>{failure}</SettingsSection>
    )
  }

  const { values, revision, saving, saveError, save } = settings
  const disabled = busy || saving

  async function persist(next: MarketSource[]): Promise<boolean> {
    setBusy(true)
    try {
      const ok = await save({ ...values, sources: next }, revision)
      if (!ok) toast.error(t().settings.saveFailed)
      return ok
    } finally {
      setBusy(false)
    }
  }

  async function addSource() {
    const url = draftUrl.trim()
    if (!isTrustedRegistryUrl(url)) {
      toast.error(t().market.urlRejected)
      return
    }
    const baseId = slugify(draftName || url)
    const used = new Set(values.sources.map((source) => source.id))
    let id = baseId
    let suffix = 2
    while (used.has(id)) {
      id = `${baseId}-${suffix}`
      suffix += 1
    }
    const next: MarketSource[] = [
      ...values.sources,
      {
        id,
        name: draftName.trim() || id,
        kind: draftKind,
        url: registryBase(url),
        enabled: true,
      },
    ]
    if (await persist(next)) {
      setDraftName("")
      setDraftUrl("")
      toast.show(t().settings.sourceAdded, { variant: "success" })
    }
  }

  async function saveInterval(minutes: number) {
    setBusy(true)
    try {
      const ok = await save(
        { ...values, autoUpdateIntervalMinutes: clampIntervalMinutes(minutes) },
        revision
      )
      if (!ok) toast.error(t().settings.saveFailed)
    } finally {
      setBusy(false)
    }
  }

  async function runUpdatesNow() {
    setCheckingUpdates(true)
    try {
      const { outcomes } = await runAutomaticUpdates({})
      const summary = summarizeAutomaticUpdates(outcomes)
      if (summary.failed) toast.error(summary.message)
      else toast.show(summary.message, { variant: "success" })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t().settings.runFailed
      )
    } finally {
      setCheckingUpdates(false)
    }
  }

  async function setLanguage(language: MarketLanguage): Promise<void> {
    if (language === values.language) return
    setBusy(true)
    try {
      const ok = await save({ ...values, language }, revision)
      if (!ok) toast.error(t().settings.saveFailed)
    } finally {
      setBusy(false)
    }
  }

  const content = (
    <>
      <SettingsCard>
        <SettingsRow
          label={t().settings.language}
          hint={t().settings.languageHint}
        />
        <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
          <LanguageChips
            theme={theme}
            value={values.language}
            onChange={(language) => void setLanguage(language)}
            disabled={disabled}
          />
        </View>
      </SettingsCard>
      {values.sources.length === 0 ? (
        <SettingsCard>
          <SettingsRow
            label={t().settings.noSources}
            hint={t().settings.noSourcesHint}
          />
        </SettingsCard>
      ) : null}

      {values.sources.map((source) => (
        <SettingsCard key={source.id}>
          <SettingsRow
            label={source.name || source.id}
            hint={`${SOURCE_KIND_LABELS[source.kind]} · ${source.url}`}
          />
          <SettingsAction
            label={source.enabled ? t().settings.enabled : t().settings.disabled}
            hint={t().settings.disabledHint}
            actionLabel={source.enabled ? t().common.disable : t().common.enable}
            disabled={disabled}
            onPress={() =>
              void persist(
                values.sources.map((item) =>
                  item.id === source.id
                    ? { ...item, enabled: !item.enabled }
                    : item
                )
              )
            }
          />
          <SettingsAction
            label={t().settings.removeSource}
            actionLabel={t().common.remove}
            disabled={disabled}
            onPress={() =>
              void persist(
                values.sources.filter((item) => item.id !== source.id)
              )
            }
          />
        </SettingsCard>
      ))}

      <SettingsSection title={t().settings.addSource}>
        <SettingsCard>
          <SettingsRow label={t().settings.type} hint={kindHints()[draftKind]} />
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <KindChips
              theme={theme}
              value={draftKind}
              onChange={setDraftKind}
              disabled={disabled}
            />
          </View>
          <SettingsInput
            label={t().settings.name}
            hint={t().settings.nameHint}
            initialValue=""
            placeholder={t().settings.namePlaceholder}
            onChangeText={setDraftName}
            disabled={disabled}
          />
          <SettingsInput
            label={t().settings.sourceUrl}
            hint={
              resolvedBase
                ? `Will read ${readTarget(resolvedBase, draftKind)}`
                : "HTTPS, or HTTP on localhost. A GitHub repository URL is resolved to its raw files automatically."
            }
            initialValue=""
            placeholder="https://github.com/owner/plugins"
            onChangeText={setDraftUrl}
            disabled={disabled}
            error={saveError}
          />
          <SettingsAction
            label={t().settings.addToSources}
            actionLabel={busy || saving ? t().common.adding : t().common.add}
            disabled={disabled}
            onPress={() => void addSource()}
          />
        </SettingsCard>
      </SettingsSection>

      <SettingsCard>
        <SettingsAction
          label={t().settings.restoreBuiltins}
          actionLabel={t().settings.restoreDefaults}
          disabled={disabled}
          onPress={() => void persist(DEFAULT_SOURCES)}
        />
        <SettingsInput
          label={t().settings.interval}
          hint={t().settings.intervalHint}
          initialValue={`${values.autoUpdateIntervalMinutes}`}
          placeholder={`${AUTO_UPDATE_INTERVAL.default}`}
          onChangeText={(text) => setIntervalDraft(text)}
          disabled={disabled}
        />
        <SettingsAction
          label={`${t().settings.interval}: ${values.autoUpdateIntervalMinutes} ${t().settings.intervalUnit}`}
          actionLabel={t().common.save}
          disabled={disabled}
          onPress={() => {
            const minutes = Number(
              intervalDraft ?? values.autoUpdateIntervalMinutes
            )
            if (
              !Number.isInteger(minutes) ||
              minutes < AUTO_UPDATE_INTERVAL.min ||
              minutes > AUTO_UPDATE_INTERVAL.max
            ) {
              toast.error(
                t().settings.intervalInvalid(
                  AUTO_UPDATE_INTERVAL.min,
                  AUTO_UPDATE_INTERVAL.max
                )
              )
              return
            }
            void saveInterval(minutes)
          }}
        />
        <SettingsAction
          label={t().settings.runUpdates}
          hint={t().settings.runUpdatesHint}
          actionLabel={checkingUpdates ? t().settings.running : t().settings.runNow}
          disabled={checkingUpdates}
          onPress={() => void runUpdatesNow()}
        />
      </SettingsCard>
    </>
  )

  return embedded ? (
    content
  ) : (
    <SettingsSection title={t().settings.section} info={sourcesInfo()}>
      {content}
    </SettingsSection>
  )
}