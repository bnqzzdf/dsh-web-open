# dsh-web-open

DeepSeek Harness 插件：`dsh web` 启动完成后**自动打开默认浏览器**，不用再手动输入 `http://127.0.0.1:3080`。

Windows 上额外提供完整的桌面体验：

- 🐳 **系统托盘鲸鱼图标**：右键菜单（打开浏览器 / 重启服务 / 停止服务并退出）；
- 🖥️ **隐藏控制台窗口**：`dsh web` 不再占用终端；
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

## 使用

```bash
# 健壮启动（推荐）：3080 被占用时自动换端口，绝不报错
dsh-web

# 等价于 dsh web（无端口回退）
dsh web

# 指定端口
dsh-web --port 8080
```

`dsh-web` 是插件自带的健壮启动器：探测 `127.0.0.1:3080`，空闲则正常启动；已被占用则自动用 OS 分配的端口（`--port 0`）启动——浏览器、托盘、快捷方式都会自动指向实际端口。

## 配置（环境变量）

| 变量 | 默认 | 作用 |
| --- | --- | --- |
| `DSH_WEB_OPEN` | 开 | `0` 关闭整个插件 |
| `DSH_WEB_TRAY` | 开 | `0` 关闭 Windows 托盘 |
| `DSH_WEB_SHORTCUT` | 开 | `0` 不创建桌面快捷方式 |
| `DSH_WEB_HIDE_CONSOLE` | 开 | `0` 不隐藏控制台窗口 |

## 关闭

```bash
DSH_WEB_OPEN=0 dsh web
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