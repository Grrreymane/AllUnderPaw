# 一喵天下：修改前先读

本项目的维护规则见 [AGENTS.md](AGENTS.md)，请先读取并遵守。

**游戏逻辑改 `src/`，然后执行 `npm run sync` 和 `npm test`。不要直接修改 `index.html` 的 source 标记生成区，否则下次同步会覆盖修改。** 页面外壳、CSS 和字体声明仍在 HTML 中维护。

若发现 HTML 生成区里存在直接修改，先将应保留的修改迁回对应源码，再同步。代码目录见 [docs/source-layout.md](docs/source-layout.md)，嵌入顺序见 `src/modules.json`。
