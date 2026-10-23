paseo-plugin-management is a screen inside Paseo for browsing several plugin directories at once and managing the plugins you installed from them. A single sidebar item, Plugins, opens the screen, where you can search, filter by source, category and install state, switch between plugins and themes, and open any listing to read its overview, see its screenshots and review exactly which artifact it would install. A button in the header switches to the installed list, and the installed list has a button back to the market.

Themes have their own tab, shown as a grid of screenshots. Plugins show an icon, a short description, the author and the install count reported by the directory, with a badge when you already have them installed or an update is waiting. Each listing is tagged with the source it came from, so plugins with the same name from different sources stay distinct.

## Sources

The market aggregates any number of sources into one list. Two are built in and enabled by default:

- **Paseo registry** — `https://plugins.paseo.sh`, the official Paseo registry protocol v1 (`index.json`). Listings install as `owner/slug`.
- **Paseo Cafe** — `https://paseo.cafe`, the Cafe directory API (`api/plugins`). Listings install from the npm package or Git repository they declare.

You can add your own sources in Settings, under Plugins and then paseo-plugin-management. A custom source can be either kind, or let the market auto-detect the shape from what it fetches. Every source must use HTTPS, or HTTP on localhost. The directory entry for a plugin decides what gets installed, so only use a source you trust. For a source the daemon cannot install from directly, such as one served under a path prefix, the market shows the command to run yourself instead of an install button.

If a source cannot be reached, the market keeps showing the listings from the sources that did load and reports the failure for that source.

## How it works

The daemon downloads each enabled source and caches it for five minutes. A listing's overview is fetched from the same source when you open it. Screenshots and icons are loaded by your Paseo app straight from the URLs each listing declares, which are usually GitHub or a package CDN, so those hosts see your request.

Installing, updating, enabling, disabling, reloading and uninstalling run the `paseo` command line on the daemon host. Before an install, the app shows the pinned npm version or Git commit and the repository it comes from, and you confirm. The daemon then installs exactly that reviewed artifact. If the directory moves the pin after you opened the review, the install is refused. Nothing is installed on its own: every install, update, enable, disable, reload and uninstall is an action you start.

## Language

The interface ships in English and Chinese. paseo-plugin-management settings have a Language choice: Automatic follows the system language and falls back to English, or you can pin either language. Listing bodies such as READMEs and caveats are not translated; they appear in the language each plugin provides.

## Setup

paseo-plugin-management needs Paseo 0.11.0 or later and the `paseo` command on the daemon's path.

## Capabilities and limits

- Automatic updates are off by default. Switch one on from its detail page, and the daemon checks 30 seconds after it starts and then every six hours, moves that plugin to its current directory pin or to the latest release of the npm package or Git source it was installed from, and keeps going if one plugin fails. Run the check immediately from paseo-plugin-management's settings.
- The market sidebar item shows the number of plugins with an update available.
- The installed view lists everything you installed, with enable, disable, reload, update and uninstall actions and the state each plugin reported.
- A composer attachment source lets you attach a plugin's listing to a prompt, so an agent can review it before you install. The listing text then becomes part of that prompt and reaches the agent provider the way your other messages do.
- paseo-plugin-management stores your sources, your last search and filters, the plugins you switched automatic updates on for, and the plugins you disabled in its Paseo settings. It contacts only the sources you enabled; installs and updates fetch the artifact from npm or Git the way the `paseo` command normally does.
- Plugins installed from npm or Git before the directory existed are recognized by package name or repository, and shown as installed when they match a listing.
- Listed plugins are community submissions. They still run unsandboxed on your daemon host, so read a plugin's source before installing it.
