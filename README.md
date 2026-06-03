# 专注结界

中文 Windows 桌面应用 MVP：一键临时封锁 B 站等诱惑网站，用“守界”倒计时、抵挡记录和战报反馈替代冰冷的网站屏蔽。

## 当前能力

- Windows 托盘应用，关闭窗口后仍在托盘运行。
- B 站结界预设，覆盖网页、直播、短链和常见 CDN 域名。
- 娱乐网站结界预设，包含 B 站、微博、知乎热榜、抖音网页版。
- 支持附加域名、10/25/50/90 分钟预设和 1 到 480 分钟自定义时长。
- 普通模式可提前解除，死守模式提前解除需要确认文本。
- 修改 hosts 前自动备份，只移除自己标记的托管区块。
- 倒计时结束自动恢复 hosts。
- 本地统计累计分钟、成功局数、抵挡次数、结界石、等级和成就。
- 本地 80/443 端口可用时，会尝试统计被拦截访问次数。

## 启动

```powershell
cd D:\Code\focus-jiejie
npm install
npm run start
```

修改 `C:\Windows\System32\drivers\etc\hosts` 需要管理员权限。普通启动时，开始/恢复结界会弹出 UAC。更顺手的方式是直接管理员启动：

```powershell
cd D:\Code\focus-jiejie
npm run start:admin
```

## 恢复 hosts

应用内点击 `恢复 hosts` 会移除 `# BEGIN FOCUS-JIEJIE` 到 `# END FOCUS-JIEJIE` 的托管区块，并刷新 DNS。

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

## 开发检查

```powershell
npm run check
npm run test:ui
```

## 打包便携版

```powershell
npm run icons
npm run dist:portable
```

产物会生成在：

```text
D:\Code\focus-jiejie\dist\FocusJiejie-0.1.3-portable.exe
```

便携版会嵌入 `assets/icon.ico` 作为 Windows 图标。便携版自身不会强制以管理员身份启动；开始/恢复封锁时，应用仍会通过 UAC 辅助脚本请求管理员权限。

## 已知边界

hosts 封锁对浏览器已有标签页、已有连接或 DNS 缓存不一定立即生效。启动结界后，如果已经打开的封锁网站仍能访问，请重启浏览器或新开浏览器后再验证。
