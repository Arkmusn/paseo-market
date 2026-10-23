import { useSettings } from "@getpaseo/plugin/client"
import { directorySettings, type MarketLanguage } from "../shared/directory"

export type Locale = "en" | "zh"

/**
 * 当前语言。每个屏幕在渲染开始时用 useMarketLocale() 写入，之后同一渲染树里的
 * 组件和纯函数都读这一份，避免把语言表一路透传。
 */
let active: Locale = "en"

function detectLocale(): Locale {
  try {
    const language = (
      globalThis as { navigator?: { language?: string } }
    ).navigator?.language
    const tag = language || new Intl.DateTimeFormat().resolvedOptions().locale
    return tag.toLowerCase().startsWith("zh") ? "zh" : "en"
  } catch {
    return "en"
  }
}

export function resolveLocale(language: MarketLanguage): Locale {
  if (language === "zh") return "zh"
  if (language === "en") return "en"
  return detectLocale()
}

/** 读取设置里的语言并把它设为本次渲染使用的语言。 */
export function useMarketLocale(): Locale {
  const settings = useSettings(directorySettings)
  const locale =
    settings.status === "ready"
      ? resolveLocale(settings.values.language)
      : detectLocale()
  active = locale
  return locale
}

const en = {
  common: {
    retry: "Retry",
    reset: "Reset",
    remove: "Remove",
    add: "Add",
    adding: "Adding…",
    save: "Save",
    reload: "Reload",
    enable: "Enable",
    disable: "Disable",
    install: "Install",
    installed: "Installed",
    uninstall: "Uninstall",
    update: "Update",
    back: "Back",
  },
  market: {
    title: "Plugin directory",
    plugins: "Plugins",
    themes: "Themes",
    pluginCount: (n: number) => `${n} plugin${n === 1 ? "" : "s"}`,
    themeCount: (n: number) => `${n} theme${n === 1 ? "" : "s"}`,
    loadingList: (segment: string) => `Loading ${segment}…`,
    searchPlaceholder: "Search plugins and themes",
    updatesAvailable: (n: number) =>
      `${n} update${n === 1 ? "" : "s"} available`,
    installations: (n: number) =>
      `${n} installation${n === 1 ? "" : "s"}`,
    installs: (n: number) => `${n} install${n === 1 ? "" : "s"}`,
    badgeUpdated: "Updated",
    badgeAdded: "Added",
    noDescription: "No description provided.",
    installedButton: (n: number) => (n > 0 ? `Installed ${n}` : "Installed"),
    settingsButton: "Settings",
    submitPlugin: "Submit a plugin",
    refresh: "Refresh",
    refreshing: "Refreshing…",
    filters: "Filters",
    show: "Show",
    sortBy: "Sort by",
    resetFilters: "Reset status and sort",
    featured: "Featured",
    statusAll: "All",
    statusInstalled: "Installed",
    statusUpdates: "Updates",
    statusNotInstalled: "Not installed",
    sortUpdatesFirst: "Updates first",
    sortPopular: "Popular",
    sortRecent: "Recently updated",
    sortRecentlyAdded: "Recently added",
    sortAZ: "A to Z",
    sourceLabel: "Source",
    sourceFilter: "Filter by market source",
    categoryLabel: "Category",
    categories: "Plugin categories",
    browseTabs: "Browse plugins or themes",
    loadingSettings: "Loading paseo-plugin-management settings…",
    checkingUpdates: "Checking for plugin updates…",
    updateStatusUnavailable: (error: string) =>
      `Update status is unavailable: ${error}`,
    installedCheckFailed: (error: string) =>
      `Couldn't check installed plugins: ${error}`,
    refreshFailed: (error: string) =>
      `Couldn't refresh the plugin directory: ${error}. Showing the last loaded list.`,
    sourceFailed: (name: string, error: string) => `${name}: ${error}`,
    invalidListings: (n: number) =>
      n === 1
        ? "1 listing failed validation and is hidden."
        : `${n} listings failed validation and are hidden.`,
    noPluginsListed: "No plugins listed",
    noPluginsListedBody: "This registry doesn't list any plugins.",
    noMatchTitle: (segment: string) => `No ${segment} match`,
    noMatchBody: (segment: string) =>
      `Nothing in ${segment} matches the current search and filters.`,
    resultsIn: (n: number, other: string) =>
      `${n} result${n === 1 ? "" : "s"} in ${other}`,
    noListedTitle: (segment: string) => `No ${segment} listed`,
    noListedBody: (segment: string) =>
      `This registry doesn't list any ${segment}.`,
    allUpToDate: "All up to date",
    allUpToDateBody: (segment: string) =>
      `All installed ${segment} are up to date.`,
    noResults: "No results",
    noResultsBody: (segment: string) =>
      `No ${segment} match the current search and filters.`,
    clearFilters: "Clear filters",
    loadFailed: "Couldn't load the plugin directory",
    saveAutoUpdateFailed: "Failed to save automatic update preference.",
    urlRejected: "Source URL must use HTTPS, or HTTP on localhost.",
    installFailed: "Install failed",
    refreshFailedShort: "Refresh failed",
  },
  installed: {
    title: "Installed plugins",
    browseMarket: "Browse the plugin market",
    count: (n: number) => `${n} installed`,
    updatesAvailable: (n: number) =>
      ` · ${n} update${n === 1 ? "" : "s"} available`,
    running: "Running",
    disabled: "Disabled",
    failed: "Failed",
    updateAvailable: "Update available",
    reading: "Reading installed plugins…",
    readFailed: "Couldn't read installed plugins.",
    empty: "No plugins are installed yet.",
    fromMarket: (id: string) => `From the market: ${id}`,
    cliUnavailable:
      "The `paseo` CLI on the daemon is unavailable or too old; install, uninstall, and update may fail.",
    autoUpdate: "Automatic updates",
    autoUpdateOn: "On",
    autoUpdateOff: "Off",
    autoUpdateUnsupported: "Local directory installs are never updated automatically.",
  },
  settings: {
    section: "paseo-plugin-management",
    sources: "Market sources",
    tryAgain: "Try again",
    restoreDefaultSettings: "Restore default settings",
    noSources: "No market sources",
    noSourcesHint: "Add one below, or restore the defaults.",
    enabled: "Enabled",
    disabled: "Disabled",
    disabledHint: "Disabled sources are not fetched.",
    removeSource: "Remove this source",
    addSource: "Add a market source",
    type: "Type",
    name: "Name",
    nameHint: "Shown in the source filter. Optional.",
    namePlaceholder: "e.g. Company registry",
    sourceUrl: "Source URL",
    urlHint:
      "HTTPS, or HTTP on localhost. A GitHub repository URL is resolved to its raw files automatically.",
    willRead: (url: string) => `Will read ${url}`,
    addToSources: "Add to the market sources",
    restoreBuiltins: "Restore the built-in registry and Cafe sources",
    restoreDefaults: "Restore defaults",
    runUpdates: "Run automatic updates now",
    runUpdatesHint:
      "Automatic updates are off by default. Plugins you switch on are checked on the interval below.",
    interval: "Check interval",
    intervalHint:
      "How often the scheduled run checks. Minutes, 15 to 10080 (one week).",
    intervalUnit: "minutes",
    everyMinutes: (n: number) => `Currently every ${n} minutes`,
    intervalSaved: "Check interval saved.",

    intervalInvalid: (min: number, max: number) =>
      `Use a whole number of minutes from ${min} to ${max}.`,
    running: "Running…",
    runNow: "Run now",
    sourceAdded: "Market source added.",
    runFailed: "Automatic update run failed.",
    saveFailed: "Failed to save market sources.",
    language: "Language",
    languageHint: "Interface language. Automatic follows the system language.",
    languageAuto: "Automatic",
    languageEn: "English",
    languageZh: "中文",
    kindRegistry:
      "Paseo registry protocol v1: <url>/index.json. Entries install by owner/slug, or by their pinned npm/Git artifact.",
    kindCafe:
      "paseo.cafe directory API: <url>/api/plugins. Entries install from their declared npm package or Git repository.",
    kindCustom:
      "Any JSON document; the shape is detected per source. Entries install from their declared npm/Git artifact.",
    info:
      "A market source is a browsable plugin directory. Paseo registry reads <url>/index.json; Paseo Cafe reads <url>/api/plugins; Custom JSON auto-detects either shape or a bare array. The URL must use HTTPS, or HTTP on localhost. A GitHub repository page is resolved to its raw files automatically.",
  },
  detail: {
    backToMarket: "Back to paseo-plugin-management",
    market: "paseo-plugin-management",
    readme: "README",
    loadingReadme: "Loading README…",
    readmeFailed: "Could not load the README.",
    copyText: "Copy text",
    automaticUpdates: "Automatic updates",
    copyError: "Copy error",
    copyErrorOutput: "Copy action error output",
    copyInstallCommand: "Copy install command",
    installCommand: "Install command",
    updateCommand: "Update command",
    trustedCode: "Trusted, unsandboxed code",
    reviewInstall: (name: string) => `Review ${name} installation`,
    installBody:
      "Paseo installs exactly this artifact. If the registry pin changes before you confirm, the install is refused.",
    trustedBody:
      "Plugin server code, build commands, dependencies, and future updates run as trusted code on the Paseo host. Review the source before installing.",
    updateTitle: (name: string) => `Update ${name}?`,
    unknownRevision: "unknown revision",
    updateTo: "Update to",
    latestPinned: "the latest pinned release",
    updating: "Updating…",
    installing: "Installing…",
    updatingSelf:
      "The plugin market restarts when this update finishes, so the result appears once it reloads.",
    updateBody:
      "Updating replaces trusted, unsandboxed plugin code on this Paseo host. Review the source before continuing.",
    cancel: "Cancel",
    viewRepository: "View repository",
    reportPlugin: "Report plugin",
    viewListing: "View listing",
  },
  gallery: {
    video: "Video",
    openVideo: "Open video",
    openFullSize: "Open full size",
  },
  sidebar: {
    updatesAvailable: (n: number) =>
      `${n} plugin ${n === 1 ? "update" : "updates"} available`,
    checkFailed: "Plugin update check failed",
  },
  updates: {
    updatedClause: (n: number) => `Updated ${n} plugin${n === 1 ? "" : "s"}`,
    failedClause: (n: number) => `${n} failed`,
    skipped: (n: number) => ` ${n} skipped (automatic updates off).`,
    none: "No automatic updates available.",
  },
}

const zh: typeof en = {
  common: {
    retry: "重试",
    reset: "重置",
    remove: "移除",
    add: "添加",
    adding: "添加中…",
    save: "保存",
    reload: "重载",
    enable: "启用",
    disable: "禁用",
    install: "安装",
    installed: "已安装",
    uninstall: "卸载",
    update: "更新",
    back: "返回",
  },
  market: {
    title: "插件目录",
    plugins: "插件",
    themes: "主题",
    pluginCount: (n) => `${n} 个插件`,
    themeCount: (n) => `${n} 个主题`,
    loadingList: (segment) => `正在加载${segment}…`,
    searchPlaceholder: "搜索插件和主题",
    updatesAvailable: (n) => `${n} 个可更新`,
    installations: (n) => `${n} 个安装`,
    installs: (n) => `${n} 次安装`,
    badgeUpdated: "更新于",
    badgeAdded: "收录于",
    noDescription: "未提供说明。",
    installedButton: (n) => (n > 0 ? `已安装 ${n}` : "已安装"),
    settingsButton: "设置",
    submitPlugin: "提交插件",
    refresh: "刷新",
    refreshing: "刷新中…",
    filters: "筛选",
    show: "显示",
    sortBy: "排序",
    resetFilters: "重置状态与排序",
    featured: "精选",
    statusAll: "全部",
    statusInstalled: "已安装",
    statusUpdates: "可更新",
    statusNotInstalled: "未安装",
    sortUpdatesFirst: "更新优先",
    sortPopular: "热门",
    sortRecent: "最近更新",
    sortRecentlyAdded: "最近收录",
    sortAZ: "按名称",
    sourceLabel: "来源",
    sourceFilter: "按市场源筛选",
    categoryLabel: "分类",
    categories: "插件分类",
    browseTabs: "浏览插件或主题",
    loadingSettings: "正在读取 paseo-plugin-management 设置…",
    checkingUpdates: "正在检查插件更新…",
    updateStatusUnavailable: (error) => `无法获取更新状态：${error}`,
    installedCheckFailed: (error) => `无法检查已安装插件：${error}`,
    refreshFailed: (error) => `刷新插件目录失败：${error}。继续显示上次加载的列表。`,
    sourceFailed: (name, error) => `${name}：${error}`,
    invalidListings: (n) => `有 ${n} 个条目未通过校验，已隐藏。`,
    noPluginsListed: "目录里没有插件",
    noPluginsListedBody: "这个源没有列出任何插件。",
    noMatchTitle: (segment) => `没有匹配的${segment}`,
    noMatchBody: (segment) => `${segment}中没有符合当前搜索和筛选条件的条目。`,
    resultsIn: (n, other) => `${other}中有 ${n} 个结果`,
    noListedTitle: (segment) => `没有${segment}`,
    noListedBody: (segment) => `这个源没有列出任何${segment}。`,
    allUpToDate: "全部已是最新",
    allUpToDateBody: (segment) => `所有已安装的${segment}都已是最新版本。`,
    noResults: "没有结果",
    noResultsBody: (segment) => `没有${segment}符合当前搜索和筛选条件。`,
    clearFilters: "清除筛选",
    loadFailed: "无法加载插件目录",
    saveAutoUpdateFailed: "保存自动更新偏好失败。",
    urlRejected: "源地址必须是 HTTPS，或 localhost 上的 HTTP。",
    installFailed: "安装失败",
    refreshFailedShort: "刷新失败",
  },
  installed: {
    title: "已安装插件",
    browseMarket: "浏览插件市场",
    count: (n) => `已安装 ${n} 个`,
    updatesAvailable: (n) => ` · ${n} 个可更新`,
    running: "运行中",
    disabled: "已禁用",
    failed: "失败",
    updateAvailable: "有可用更新",
    reading: "正在读取已安装插件…",
    readFailed: "无法读取已安装插件。",
    empty: "还没有安装任何插件。",
    fromMarket: (id) => `来自市场：${id}`,
    cliUnavailable:
      "daemon 上的 `paseo` CLI 不可用或版本过旧；安装、卸载和更新可能失败。",
    autoUpdate: "自动更新",
    autoUpdateOn: "开启",
    autoUpdateOff: "关闭",
    autoUpdateUnsupported: "本地目录安装的插件不会自动更新。",
  },
  settings: {
    section: "paseo-plugin-management",
    sources: "市场源",
    tryAgain: "重试",
    restoreDefaultSettings: "恢复默认设置",
    noSources: "没有市场源",
    noSourcesHint: "在下方添加一个，或恢复默认值。",
    enabled: "已启用",
    disabled: "已禁用",
    disabledHint: "已禁用的源不会被抓取。",
    removeSource: "移除此源",
    addSource: "添加市场源",
    type: "类型",
    name: "名称",
    nameHint: "显示在源筛选里，可留空。",
    namePlaceholder: "例如：公司注册表",
    sourceUrl: "源地址",
    urlHint:
      "必须是 HTTPS，或 localhost 上的 HTTP。GitHub 仓库页面会自动解析成 raw 文件地址。",
    willRead: (url) => `将读取 ${url}`,
    addToSources: "添加到市场源",
    restoreBuiltins: "恢复内置注册表与 Cafe 源",
    restoreDefaults: "恢复默认",
    runUpdates: "立即执行自动更新",
    runUpdatesHint:
      "自动更新默认关闭。你打开的插件会按下方的间隔检查。",
    interval: "检查间隔",
    intervalHint: "定时任务多久执行一次。单位分钟，15 到 10080（一周）。",
    intervalUnit: "分钟",
    everyMinutes: (n) => `当前为每 ${n} 分钟`,
    intervalSaved: "检查间隔已保存。",

    intervalInvalid: (min: number, max: number) =>
      `请填写 ${min} 到 ${max} 之间的整数分钟。`,
    running: "执行中…",
    runNow: "立即执行",
    sourceAdded: "已添加市场源。",
    runFailed: "自动更新执行失败。",
    saveFailed: "保存市场源失败。",
    language: "语言",
    languageHint: "界面语言。自动表示跟随系统语言。",
    languageAuto: "自动",
    languageEn: "English",
    languageZh: "中文",
    kindRegistry:
      "Paseo 注册表协议 v1：<url>/index.json。条目按 owner/slug 安装，或按条目固定的 npm/Git 产物安装。",
    kindCafe:
      "paseo.cafe 目录 API：<url>/api/plugins。条目按其声明的 npm 包或 Git 仓库安装。",
    kindCustom:
      "任意 JSON 文档，逐源自动识别形态。条目按其声明的 npm/Git 产物安装。",
    info:
      "市场源就是可浏览的插件目录。Paseo 注册表读取 <url>/index.json；Paseo Cafe 读取 <url>/api/plugins；自定义 JSON 会自动识别这两种形态或裸数组。地址必须是 HTTPS，或 localhost 上的 HTTP。GitHub 仓库页面会自动解析成 raw 文件地址。",
  },
  detail: {
    backToMarket: "返回 paseo-plugin-management",
    market: "paseo-plugin-management",
    readme: "说明文档",
    loadingReadme: "正在加载说明文档…",
    readmeFailed: "无法加载说明文档。",
    copyText: "复制文本",
    automaticUpdates: "自动更新",
    copyError: "复制错误",
    copyErrorOutput: "复制操作错误输出",
    copyInstallCommand: "复制安装命令",
    installCommand: "安装命令",
    updateCommand: "更新命令",
    trustedCode: "受信任、无沙箱代码",
    reviewInstall: (name) => `确认安装 ${name}`,
    installBody:
      "Paseo 会严格安装这个产物。若你确认前注册表上的锚点发生变化，安装会被拒绝。",
    trustedBody:
      "插件的服务端代码、构建命令、依赖与后续更新都会在 Paseo 主机上以受信任代码运行。安装前请审阅源码。",
    updateTitle: (name) => `更新 ${name}？`,
    unknownRevision: "未知版本",
    updateTo: "更新到",
    latestPinned: "最新固定版本",
    updating: "更新中…",
    installing: "安装中…",
    updatingSelf:
      "更新完成后 paseo-plugin-management 会重启，结果会在重新加载后出现。",
    updateBody:
      "更新会替换这台 Paseo 主机上的受信任、无沙箱插件代码。继续前请审阅源码。",
    cancel: "取消",
    viewRepository: "查看仓库",
    reportPlugin: "举报插件",
    viewListing: "查看条目",
  },
  gallery: {
    video: "视频",
    openVideo: "打开视频",
    openFullSize: "查看原图",
  },
  sidebar: {
    updatesAvailable: (n) => `${n} 个插件可更新`,
    checkFailed: "插件更新检查失败",
  },
  updates: {
    updatedClause: (n) => `已更新 ${n} 个插件`,
    failedClause: (n) => `${n} 个失败`,
    skipped: (n) => ` 跳过 ${n} 个（已关闭自动更新）。`,
    none: "当前没有可自动更新的项。",
  },
}

export type Messages = typeof en

const messages: Record<Locale, Messages> = { en, zh }

/** 当前语言的消息表。 */
export function t(): Messages {
  return messages[active]
}