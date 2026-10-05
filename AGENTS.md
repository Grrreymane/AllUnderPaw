# 一喵天下：项目维护约定

本目录的游戏代码以 `src/` 为准。发布仍是单个 `index.html`，但这不代表在 HTML 中直接维护游戏逻辑。

- 修改玩法、剧情、人物数据或界面逻辑时，编辑对应的 `src/` 文件，然后运行 `npm run sync`。
- **禁止直接编辑 `index.html` 的 `// ==== source:src/... ====` 与对应结束标记之间的生成内容。** 同步会用源码覆盖这些区域。如果发现有人直接修改过这些区域，先比较并把需要保留的修改迁回对应源码，再同步，不要直接覆盖。
- HTML 中生成区之外的页面外壳、样式、字体声明可以直接维护。
- `src/modules.json` 是嵌入顺序清单。移动文件时同时更新清单、HTML 的成对路径标记、生成工具和文档引用；不得改变执行顺序、共享作用域或系统钩子顺序。
- `src/data/scenario-presets.js` 是离线生成的预设数据。不要手工修改或因整理文件而重新生成；维护工具为 `tools/build-scenarios.js`。
- 玩家行动逻辑在 `src/systems/actions.js`；行动按钮与列表绘制在 `src/ui/action-list.js`。
- 修改后运行 `npm run sync` 和 `npm test`。涉及交互、绘制或启动时，再运行现有 `npm run test:browser`；执行方式见 README。文字变化后同步更新字体子集。
- 提交时同时包含源码和同步后的 HTML。保持真实基因、婚姻、怀孕、生父及旧存档兼容；整理文件不得顺带改变这些规则。
- 报错定位：`npm run locate -- 行号:列号`。必须使用与报错版本匹配的 HTML；历史构建可加 `--html 路径`。

目录地图、验证和维护流程见 [docs/source-layout.md](docs/source-layout.md)。服务响应、凭据、临时生成图和测试输出留在已忽略的临时目录，不进入提交。
