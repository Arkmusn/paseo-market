# 插件市场 / Plugin market

[中文](#中文) · [English](#english)

---

<a id="中文"></a>

## 这是什么

在 Paseo 内统一管理插件的屏幕:聚合多个插件市场源,浏览、安装、卸载、启用、禁用、重载与更新插件,无需离开应用或手敲命令行。

## 功能

- **多市场源**:内置 Paseo 官方注册表与 paseo.cafe 目录,可添加任意数量的自定义 JSON 源(自动识别注册表协议、Cafe 形态或裸数组);每个条目标注来源,同名插件互不混淆
- **添加源很简单**:直接粘贴 GitHub 仓库页面地址即可,自动解析成 raw 文件地址,不必手工拼 `raw.githubusercontent.com` 链接
- **已装插件管理**:启用(绿)/禁用(红)、重载、更新、卸载,一行一个操作按钮
- **受审阅的安装锚点**:安装前展示将要执行的命令与固定 commit;目录上的锚点若在确认后变动,安装会被拒绝
- **自动更新**:默认开启,daemon 启动 30 秒后检查,之后每 6 小时一次;可按插件关闭,也可在设置里立即执行
- **侧边栏徽标**:有可用更新时,Plugins 侧边栏项显示更新数量
- **附件来源**:把插件条目作为附件发给 agent,让它在安装前审阅

## 安装

在 Paseo 的插件市场里安装本插件,或直接运行:

```
paseo plugin add git:Arkmusn/paseo-market
```

需要 Paseo 0.11.0-beta.4 或更高版本,且 daemon 的 PATH 上有 `paseo` 命令。

## 添加市场源:支持的地址形式

设置 → 插件市场 → 添加源。以下地址都会被自动解析(输入框下方会实时显示实际读取的地址):

| 你输入 | 实际读取 |
| --- | --- |
| `https://github.com/<owner>/<repo>` | `raw…/HEAD/index.json`(HEAD = 默认分支) |
| `https://github.com/<owner>/<repo>/tree/<分支>[/<子目录>]` | raw 对应路径 |
| `https://github.com/<owner>/<repo>/blob/<分支>/index.json` | raw 对应目录 |
| `https://raw.githubusercontent.com/<owner>/<repo>/refs/heads/<分支>` | 规范为 `raw…/<分支>` |
| 其它 HTTPS 地址 | 原样使用(`<地址>/index.json`) |

必须 HTTPS(localhost 允许 HTTP);非 GitHub 域名不做解析。

## 安装与更新的语义

`--ref <commit>` 只约束**安装那一刻**的版本;之后的 `paseo plugin update` 解析远端默认分支 HEAD 作为目标。列表里的 **Reload 只重启插件进程**(使用现有目录),不会重新下载;要拉新代码用 **Update**。本地目录安装的插件点 Update 会提示"无可下载"。

## 开发

```
npm install
npx tsc --noEmit
npx vitest run
```

## 许可

Apache-2.0。本项目是 [Paseo Cafe](https://github.com/paseo-cafe/paseo-cafe) 的修改分支,改动清单见 [NOTICE](NOTICE)。

---

<a id="english"></a>

## What is this

A screen inside Paseo for managing plugins: it aggregates several plugin directories into one searchable list and installs, uninstalls, enables, disables, reloads and updates plugins through the daemon's `paseo` CLI.

## Features

- **Multiple market sources**: the official Paseo registry and the paseo.cafe directory are built in; add any number of custom JSON sources (registry protocol, Cafe shape, or a bare array are auto-detected). Every listing is tagged with its source.
- **Easy source URLs**: paste a plain GitHub repository URL and it is resolved to the raw file URL automatically — no hand-built `raw.githubusercontent.com` links.
- **Installed plugin management**: enable (green) / disable (red), reload, update and uninstall, one row of actions per plugin.
- **Reviewed install anchors**: the exact command and pinned commit are shown before installing; if the catalog's anchor moves after you confirm, the install is refused.
- **Automatic updates**: on by default; checked 30 seconds after the daemon starts and every 6 hours after that. Opt out per plugin, or run a check immediately from settings.
- **Sidebar badge**: the Plugins sidebar item shows the number of pending updates.
- **Attachment source**: attach a listing to a prompt so an agent can review it before you install.

## Install

Install it from the plugin market inside Paseo, or run:

```
paseo plugin add git:Arkmusn/paseo-market
```

Requires Paseo 0.11.0-beta.4 or later and the `paseo` command on the daemon's path.

## Adding a market source: accepted URL forms

Settings → Plugin market → Add a market source. These forms are resolved automatically (the form previews the URL that will actually be read):

| You type | It reads |
| --- | --- |
| `https://github.com/<owner>/<repo>` | `raw…/HEAD/index.json` (HEAD = default branch) |
| `https://github.com/<owner>/<repo>/tree/<ref>[/<dir>]` | raw at that path |
| `https://github.com/<owner>/<repo>/blob/<ref>/index.json` | raw at that directory |
| `https://raw.githubusercontent.com/<owner>/<repo>/refs/heads/<ref>` | canonicalized to `raw…/<ref>` |
| any other HTTPS URL | used as-is (`<url>/index.json`) |

HTTPS required (HTTP allowed on localhost); only GitHub URLs are resolved.

## Install and update semantics

`--ref <commit>` pins only the moment of installation; a later `paseo plugin update` resolves the remote default-branch HEAD as its target. **Reload** in the installed list restarts the plugin from its existing directory and never re-downloads — use **Update** for that. A plugin installed from a local directory reports that there is nothing to download.

## Development

```
npm install
npx tsc --noEmit
npx vitest run
```

## License

Apache-2.0. This is a modified fork of [Paseo Cafe](https://github.com/paseo-cafe/paseo-cafe); see [NOTICE](NOTICE) for the changes.
