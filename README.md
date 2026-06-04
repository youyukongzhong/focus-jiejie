# 专注结界

一个中文 Windows 专注工具：临时封锁 B 站等容易分心的网站，用倒计时、抵挡次数、战报和成就反馈帮你守住当前这一段。

## 普通用户怎么用

推荐下载安装版：

1. 打开 [Releases](https://github.com/youyukongzhong/focus-jiejie/releases)。
2. 下载 `FocusJiejie-0.1.5-setup.exe`。
3. 双击安装，安装向导里可以选择安装位置，也可以选择是否创建桌面快捷方式。
4. 打开“专注结界”，选择时长和目标结界，点击“启动结界”。

也可以下载免安装版：

1. 下载 `FocusJiejie-0.1.5-portable.exe`。
2. 放到一个固定目录后双击运行。
3. 如果在设置里开启“开机自启”，后续不要随意移动这个 exe 文件位置。

修改 hosts 需要管理员权限。启动或恢复结界时，Windows 可能会弹出 UAC 权限确认，这是正常现象。

## 设置

- 右上角“设置”里可以开启或关闭“开机自启”。
- 开机自启会在登录 Windows 后把应用启动到托盘。
- 关闭窗口不会直接退出应用，应用会继续在托盘运行。
- 右上角“设置”里可以切换中文/英文。
- 安装版会检查 GitHub Release 上的新版本；发现新版后可以在应用里下载并重启安装，安装位置保持不变。

## 当前能力

- B 站结界预设，覆盖网页、直播、短链和常见 CDN 域名。
- 娱乐网站结界预设，包含 B 站、微博、知乎热榜、抖音网页版。
- 支持附加域名，例如 `https://www.google.com/` 会自动规范为 `www.google.com`。
- 支持 10/25/50/90 分钟预设，以及 1 到 480 分钟自定义守界时长。
- 普通模式可提前解除，死守模式提前解除需要输入确认文本。
- “恢复 hosts”只用于结界结束后或状态异常时清理托管区块；守界进行中不能用它绕过提前解除。
- 修改 hosts 前自动备份，只移除自己标记的托管区块。
- 倒计时结束后自动恢复 hosts。
- 本地统计累计分钟、成功局数、抵挡次数、结界石、等级和成就。
- 本地 80/443 端口可用时，会尝试统计被拦截访问次数。

## 已知边界

hosts 封锁对浏览器已经打开的标签页、已有连接或 DNS 缓存不一定立刻生效。启动结界后，如果已经打开的封锁网站仍能访问，请重启浏览器或新开浏览器后再验证。

本工具不会强制关闭 Chrome/Edge，也不会额外写入防火墙规则，避免误伤正常浏览器状态。

## 开发

```powershell
cd D:\Code\focus-jiejie
npm install
npm run start
```

检查：

```powershell
npm run check
npm run test:ui
```

打包：

```powershell
npm run icons
npm run dist:portable
npm run dist:installer
```

一次性生成安装版和免安装版：

```powershell
npm run dist:win
```

产物会生成到 `dist/`：

- `FocusJiejie-0.1.5-portable.exe`
- `FocusJiejie-0.1.5-setup.exe`

## 目录说明

项目根目录是源码目录，不是最终软件安装目录：

- `src/`：应用源码。
- `src/renderer/`：主界面 HTML/CSS/前端逻辑。
- `scripts/`：打包、hosts 辅助脚本、UI 烟测脚本。
- `assets/`：应用图标资源。
- `node_modules/`：开发依赖，不上传 Git。
- `dist/`：打包产物目录，不上传 Git。

`dist/` 里常见文件的含义：

- `win-unpacked/`：解包后的本地测试目录，可以双击里面的 `专注结界.exe` 快速预览。
- `FocusJiejie-x.y.z-setup.exe`：安装版，正式发布时上传到 GitHub Release。
- `FocusJiejie-x.y.z-portable.exe`：免安装版，正式发布时也可以上传到 GitHub Release。
- `latest.yml` 和 `*.blockmap`：安装版自动更新需要的元数据，发布新版时要一起上传。
- `preview-x.y.z/`：本地预览包目录，只用于你先看效果；确认后再发布到 GitHub。

推荐流程：

1. 本地开发和测试都在 `D:\Code\focus-jiejie`。
2. 你要先看效果时，使用 `dist/preview-x.y.z/` 里的 exe。
3. 你确认可以发布后，再把对应版本的安装包、更新元数据和源码推到 GitHub。

## 手动恢复 hosts

应用内点击“恢复 hosts”会移除 `# BEGIN FOCUS-JIEJIE` 到 `# END FOCUS-JIEJIE` 的托管区块，并刷新 DNS。它不是提前解除按钮：守界正在进行时会被禁用；如果要提前结束，请点击“提前解除”，死守模式需要输入确认文本。

如果应用异常退出，也可以手动打开：

```text
C:\Windows\System32\drivers\etc\hosts
```

删除以下标记之间的内容：

```text
# BEGIN FOCUS-JIEJIE
...
# END FOCUS-JIEJIE
```
