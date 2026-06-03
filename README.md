# 专注结界

一个中文 Windows 专注工具：临时封锁 B 站等容易分心的网站，用倒计时、抵挡次数、战报和成就反馈帮你守住当前这一段。

## 普通用户怎么用

推荐下载安装版：

1. 打开 [Releases](https://github.com/youyukongzhong/focus-jiejie/releases)。
2. 下载 `FocusJiejie-0.1.4-setup.exe`。
3. 双击安装，安装向导里可以选择安装位置，也可以选择是否创建桌面快捷方式。
4. 打开“专注结界”，选择时长和目标结界，点击“启动结界”。

也可以下载免安装版：

1. 下载 `FocusJiejie-0.1.4-portable.exe`。
2. 放到一个固定目录后双击运行。
3. 如果在设置里开启“开机自启”，后续不要随意移动这个 exe 文件位置。

修改 hosts 需要管理员权限。启动或恢复结界时，Windows 可能会弹出 UAC 权限确认，这是正常现象。

## 设置

- 右上角“设置”里可以开启或关闭“开机自启”。
- 开机自启会在登录 Windows 后把应用启动到托盘。
- 关闭窗口不会直接退出应用，应用会继续在托盘运行。

## 当前能力

- B 站结界预设，覆盖网页、直播、短链和常见 CDN 域名。
- 娱乐网站结界预设，包含 B 站、微博、知乎热榜、抖音网页版。
- 支持附加域名，例如 `https://www.google.com/` 会自动规范为 `www.google.com`。
- 支持 10/25/50/90 分钟预设，以及 1 到 480 分钟自定义守界时长。
- 普通模式可提前解除，死守模式提前解除需要输入确认文本。
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

- `FocusJiejie-0.1.4-portable.exe`
- `FocusJiejie-0.1.4-setup.exe`

## 手动恢复 hosts

应用内点击“恢复 hosts”会移除 `# BEGIN FOCUS-JIEJIE` 到 `# END FOCUS-JIEJIE` 的托管区块，并刷新 DNS。

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
