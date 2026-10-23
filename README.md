# paseo-plugin-management

[English](README.md) · [中文](README.zh-CN.md)

## What is this

A screen inside Paseo for managing plugins: it aggregates several plugin directories into one searchable list and installs, uninstalls, enables, disables, reloads and updates plugins through the daemon's `paseo` CLI.

## Features

- **Multiple market sources**: the official Paseo registry and the paseo.cafe directory are built in; add any number of custom JSON sources (registry protocol, Cafe shape, or a bare array are auto-detected). Every listing is tagged with its source.
- **Easy source URLs**: paste a plain GitHub repository URL and it is resolved to the raw file URL automatically — no hand-built `raw.githubusercontent.com` links.
- **Installed plugin management**: enable (green) / disable (red), reload, update and uninstall, one row of actions per plugin.
- **Settings in place**: a Settings button in the market header opens this plugin's own configuration (sources, language, automatic updates) without leaving the page.
- **Reviewed install anchors**: the exact command and pinned commit are shown before installing; if the catalog's anchor moves after you confirm, the install is refused.
- **Automatic updates**: off by default; switch a plugin on from the installed list to have it checked 30 seconds after the daemon starts and then every 720 minutes, an interval you can change in settings. Run a check immediately from settings.
- **Sidebar badge**: the Plugins sidebar item shows the number of pending updates.
- **English and Chinese interface**: switch between Automatic, English and 中文 under Language in settings; listing bodies such as READMEs stay in the language the plugin provides.
- **Attachment source**: attach a listing to a prompt so an agent can review it before you install.

## Install

Install it from the plugin market inside Paseo, or run:

```
paseo plugin add git:Arkmusn/paseo-plugin-management
```

Requires Paseo 0.11.0 or later and the `paseo` command on the daemon's path. The installed plugin id is `paseo-plugin-management`.

## Adding a market source: accepted URL forms

Settings → paseo-plugin-management → Add a market source. These forms are resolved automatically (the form previews the URL that will actually be read):

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
