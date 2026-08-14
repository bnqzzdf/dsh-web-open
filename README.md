# dsh-web-open

DeepSeek Harness 插件：`dsh web` 启动完成后**自动打开默认浏览器**，不用再手动输入 `http://127.0.0.1:3080`。

零运行时依赖、跨平台（Windows / macOS / Linux）、TypeScript 编写（对齐官方包规范：ESM + `lib/` 产物 + 类型声明）。

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

## 关闭

```bash
DSH_WEB_OPEN=0 dsh web
```

## 工作原理

- `inject: ['webServer']`：Cordis 保证本插件在 HTTP 服务真正监听之后才激活；
- 延迟 1.2 秒：等待 `frontend-static` / `/api` 等兄弟行就绪（对齐官方 `dsh web: http://...` 就绪信号的语义）；
- 跨平台打开：Windows `cmd /c start`、macOS `open`、Linux `xdg-open`；
- `@deepseek-ai/cordis` 仅为类型/peer 依赖，运行时零依赖。

## 开发

```bash
npm install
npm test     # vitest
npm run build  # tsc -> lib/
```

## 验证

已在 Windows 上通过真实 dsh 加载验证：`dsh --profile <profile> --port 0` 启动后，插件 `apply` 正确激活并获取服务端口。

## 许可

MIT
