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

```bash
# 从 npm 安装（推荐）
dsh plugin --profile web add dsh-web-open

# 或本地开发
dsh plugin --profile web add path/to/dsh-web-open
```

## 手动配置（不通过 `dsh plugin` 命令时）

编辑 `%DSH_HOME%\profiles\web\package.json`，在 `dependencies` 中加入 `dsh-web-open`，然后编辑 `cordis.patch.yml`：

```yaml
- insert:
    - id: web-open
      name: dsh-web-open
```

## 使用

```bash
dsh web                # 服务就绪后自动打开浏览器
dsh web --port 8080    # 自动打开 http://127.0.0.1:8080
```

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