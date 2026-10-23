# paseo-plugin-management

[English](README.md) · [中文](README.zh-CN.md)

## 这是什么

在 Paseo 内统一管理插件的屏幕:聚合多个插件市场源,浏览、安装、卸载、启用、禁用、重载与更新插件,无需离开应用或手敲命令行。

## 功能

- **多市场源**:内置 Paseo 官方注册表与 paseo.cafe 目录,可添加任意数量的自定义 JSON 源(自动识别注册表协议、Cafe 形态或裸数组);每个条目标注来源,同名插件互不混淆
- **添加源很简单**:直接粘贴 GitHub 仓库页面地址即可,自动解析成 raw 文件地址,不必手工拼 `raw.githubusercontent.com` 链接
- **已装插件管理**:启用(绿)/禁用(红)、重载、更新、卸载,一行一个操作按钮
- **首页直达配置**:市场标题栏的「设置」按钮打开本插件的配置弹窗(市场源、语言、自动更新),不必离开页面
- **受审阅的安装锚点**:安装前展示将要执行的命令与固定 commit;目录上的锚点若在确认后变动,安装会被拒绝
- **自动更新**:默认关闭;在已装列表里为某个插件打开后,daemon 启动 30 秒后检查,之后按设置的间隔(默认 720 分钟)执行;也可在设置里立即执行
- **侧边栏徽标**:有可用更新时,Plugins 侧边栏项显示更新数量
- **界面中英双语**:设置里可切换「自动 / English / 中文」,默认跟随系统;条目正文(各插件的 README)保持其自身语言,不做翻译
- **附件来源**:把插件条目作为附件发给 agent,让它在安装前审阅

## 安装

在 Paseo 的「设置 → 插件」里安装本插件,或直接运行:

```
paseo plugin add git:Arkmusn/paseo-plugin-management
```

需要 Paseo 0.11.0 或更高版本,且 daemon 的 PATH 上有 `paseo` 命令。安装后的插件 id 是 `paseo-plugin-management`。

## 添加市场源:支持的地址形式

设置 → paseo-plugin-management → 添加源。以下地址都会被自动解析(输入框下方会实时显示实际读取的地址):

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
