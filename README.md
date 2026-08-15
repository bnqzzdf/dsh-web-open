# dsh-web-open

DeepSeek Harness 插件：`dsh-web-open launch` 启动服务后**自动打开默认浏览器**，不用再手动输入 `http://127.0.0.1:3080`。

Windows 上额外提供完整的桌面体验：

- 🐳 **系统托盘鲸鱼图标**：右键菜单（打开浏览器 / 重启服务 / 停止服务并退出）；
- 🖥️ **隐藏控制台窗口**：服务不再占用终端；
- 🚀 **桌面快捷方式**：自动创建「DSH Web」鲸鱼图标快捷方式（不存在时）。

零运行时依赖、TypeScript 编写（对齐官方包规范：ESM + `lib/` 产物 + 类型声明）。

## 跨平台支持

| 平台 | 自动打开浏览器 | 系统托盘 | 桌面快捷方式 | 隐藏控制台 |
| --- | --- | --- | --- | --- |
| Windows | ✅ `cmd /c start` | ✅ 鲸鱼托盘 + 右键菜单 | ✅ 自动创建 | ✅ |
| macOS | ✅ `open` | — | — | — |
| Linux | ✅ `xdg-open` | — | — | — |

托盘 / 快捷方式 / 隐藏控制台为 Windows 专属功能，macOS / Linux 上自动跳过（有测试覆盖），不影响自动打开浏览器。Linux 无桌面环境时 `xdg-open` 失败仅打印警告，不影响服务。

## 安装

> ⚠️ **重要**：`dsh plugin add`（或 pnpm add）只安装依赖包，**不会激活插件**。
> 插件必须同时在 `cordis.patch.yml` 中注册才会被加载（否则不会打开浏览器、不会显示托盘）。

### 方式一：一键安装 / 升级 / 重装（推荐）

```bash
npx -y dsh-web-open              # 安装或修复（幂等，自动注册 patch）
npx -y dsh-web-open update       # 升级到最新版本
npx -y dsh-web-open reinstall    # 强制重装
```

所有模式都会自动确保插件已注册到 `cordis.patch.yml`（缺失时自动修复），无需手动编辑任何配置文件。

### 方式二：手动两步

```bash
# 1) 安装依赖
cd %DSH_HOME%\profiles\web && pnpm add dsh-web-open

# 2) 注册插件（必须！）
#    编辑 %DSH_HOME%\profiles\web\cordis.patch.yml
#    - 文件是 [] 时，替换为：
#    - insert:
#        - id: web-open
#          name: dsh-web-open
#    - 已有其他条目时，在末尾追加同样的 - insert: 块
```

### 方式三：本地开发

```bash
dsh plugin --profile web add path/to/dsh-web-open
# 然后同样需要手动注册 cordis.patch.yml（见方式二第 2 步）
```

## 命令一览（先看这里）

### `dsh-web-open` —— 插件的统一命令（安装/升级/启动）

| 命令 | 作用 |
| --- | --- |
| `dsh-web-open` | 安装 / 修复插件（幂等；自动修复 `cordis.patch.yml` 缺失或损坏） |
| `dsh-web-open update` | **升级 profile 里的插件**到最新版（改完配置后必须用这个，重启才生效） |
| `dsh-web-open reinstall` | 强制重装 |
| `dsh-web-open launch` | **健壮启动** `dsh web`：3080 被占时自动换端口，绝不报错 |

### 别名（兼容旧用法）

| 旧命令 | 等价于 |
| --- | --- |
| `dsh-web` | `dsh-web-open launch` |
| `dsh-web-open-install` | `dsh-web-open` |

### 官方命令（别混淆）

| 命令 | 说明 |
| --- | --- |
| `dsh web` | DeepSeek Harness 官方命令。**3080 被占用时会直接报错**；需要端口回退时请用 `dsh-web-open launch` |

## 日常使用

```bash
# 启动（健壮版，推荐）
dsh-web-open launch          # 或旧名 dsh-web

# 指定端口
dsh-web-open launch --port 8080

# 升级插件（重要：只 npm update -g 不够，profile 里的插件不会变）
dsh-web-open update
```

> ⚠️ **为什么快捷方式还打开 3080？** 因为 profile 里的插件（托盘 helper / 启动器）还是旧版。
> 执行 `dsh-web-open update` 后**运行 `dsh-web-open launch`**，helper 会自动更新 `launch.ps1` 并记录实际端口。
> 验证：`%LOCALAPPDATA%\dsh-web-open\serving-url.txt`（实际端口）和 `launch.log`（快捷方式最近打开了什么）。

## 配置（环境变量）

| 变量 | 默认 | 作用 |
| --- | --- | --- |
| `DSH_WEB_OPEN` | 开 | `0` 关闭整个插件 |
| `DSH_WEB_TRAY` | 开 | `0` 关闭 Windows 托盘 |
| `DSH_WEB_SHORTCUT` | 开 | `0` 不创建桌面快捷方式 |
| `DSH_WEB_HIDE_CONSOLE` | 开 | `0` 不隐藏控制台窗口 |

## 关闭

```bash
DSH_WEB_OPEN=0 dsh-web-open launch
```

## 工作原理

- `inject: ['webServer']`：Cordis 保证本插件在 HTTP 服务真正监听之后才激活；
- 延迟 1.2 秒：等待 `frontend-static` / `/api` 等兄弟行就绪（对齐官方 `dsh web: http://...` 就绪信号的语义）；
- 跨平台打开：Windows `cmd /c start`、macOS `open`、Linux `xdg-open`；
- Windows 托盘：`assets/dsh-tray-helper.ps1`（PowerShell 辅助进程，监视宿主进程，宿主退出自动退出）；
- `@deepseek-ai/cordis` 仅为类型/peer 依赖，运行时零依赖。

## 开发

```bash
npm install
npm test     # vitest
npm run build  # tsc -> lib/
```

## 验证

已在 Windows 上通过真实 dsh 加载验证：插件 `apply` 正确激活、托盘图标显示、控制台隐藏、宿主退出后托盘自动清理。

## 许可

MIT