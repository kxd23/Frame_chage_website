# 一百零一夜 · 学生节头像框网页

为日新书院第五届学生节制作的头像框工具。用户扫码或打开链接，从相册选照片，选择四款头像框之一，调整位置和大小，然后生成新头像并保存。

- 正式网址：<https://kxd23.github.io/Frame_chage_website/>
- GitHub 仓库：<https://github.com/kxd23/Frame_chage_website>
- 本机项目目录：`D:\Code\Frame_chage_online`
- 发布分支：`main`；GitHub Pages 发布目录：`/ (root)`。

照片只在用户当前浏览器内处理，不上传，不需要登录，没有图片安全检测。保存后由用户自行到微信个人资料中更换头像。网页不会自动读取或修改微信头像。

## 1. 先认识这几个文件

```text
Frame_chage_online/
├─ index.html                  页面结构、固定文案、按钮、弹窗
├─ styles.css                  字号、字体、颜色、布局、间距
├─ app.js                      选图、动态文案、手势、绘制、生成与下载
├─ geometry.mjs                图片位置、缩放和裁剪的计算
├─ assets/
│  └─ frames/
│     ├─ frame-1.png           第 1 款合成用透明头像框
│     ├─ frame-2.png           第 2 款
│     ├─ frame-3.png           第 3 款
│     ├─ frame-4.png           第 4 款
│     ├─ thumb-1.png           第 1 款列表缩略图
│     ├─ thumb-2.png           第 2 款
│     ├─ thumb-3.png           第 3 款
│     └─ thumb-4.png           第 4 款
├─ tests/
│  └─ image-export.test.cjs    图片导出、保存兼容和失败重试检查
└─ README.md                   本说明
```

这是原生 HTML + CSS + JavaScript 静态网页，没有 React、数据库、云函数，也不需要打包。`app.js` 通过浏览器模块导入 `geometry.mjs`，两者都要保留。

原微信小程序在另一个项目目录 `D:\Code\Mini_App` 中。修改那边的 `miniprogram/` 或 `web/` 不会更新这里的新仓库；维护这个正式网页时请编辑 **`D:\Code\Frame_chage_online`**。

## 2. 页面和功能怎么连接

```text
打开 index.html
    ↓ styles.css 控制页面外观
    ↓ app.js 加载第 1 款头像框
用户从相册选图
    ↓ 在本机读取照片、限制尺寸、显示预览
拖动 / 双指缩放 / 滑块 / 方向键
    ↓ geometry.mjs 计算位置与缩放
app.js 的 draw() 绘制照片，再叠加头像框
    ↓ 点击“生成新头像”
导出 1024 × 1024 PNG
    ├─ 内嵌 PNG 图片数据 → 弹窗显示 → 手机长按保存
    └─ 临时 Blob 地址 → 下载按钮
```

同一张画布负责预览与导出，保证生成图与预览位置一致。没有上传图片、在线审核或云端保存步骤。托管平台可能记录访问日志，这与上传照片是两回事。

### 常用功能对应的位置

| 想调整什么 | 打开哪里 / 搜索什么 |
| --- | --- |
| 固定标题、说明、按钮文字 | `index.html`，直接搜索当前文字 |
| 动态按钮文字、加载或错误提示 | `app.js`，搜索当前文字或 `updateControls()` |
| 默认头像框、首次初始化 | `app.js` 的 `selectedId`、`init()` |
| 照片读取、图片尺寸限制 | `app.js` 的 `photo` 的 `change` 事件 |
| 照片和头像框如何绘制 | `app.js` 的 `draw()` |
| 拖动、双指、滚轮、方向键 | `app.js` 中的 `pointerdown`、`pointermove`、`wheel`、`keydown` |
| 重置位置 | `app.js` 的 `resetPosition()` |
| 生成图和下载文件名 | `app.js` 的 `generate` 点击事件 |
| 复制网址与成功 / 失败提示 | `app.js` 的 `share` 点击事件、`showShareMessage()`；`styles.css` 的 `.share-notice` |
| 位置与缩放范围 | `geometry.mjs` 的 `constrain()`、`zoomAt()` |
| 页面字体、颜色和所有排版 | `styles.css` |

## 3. 修改文字：先区分固定文字和动态文字

### 3.1 固定文字：编辑 index.html

用编辑器搜索当前显示的文字，替换标签中间的内容即可。例如：

```html
<p class="eyebrow">日新书院 · 第五届学生节</p>
<h1>一百零一夜<span aria-hidden="true">✦</span></h1>
<p class="intro">把这一夜的星光，装进你的头像。</p>
```

| 页面内容 | 在 index.html 中搜索 |
| --- | --- |
| 浏览器标签标题、微信内可能显示的网页标题 | `<title>` |
| 页面描述 | `name="description"` |
| 顶部书院和活动名称 | `class="eyebrow"` |
| 大标题“一百零一夜” | `<h1>` |
| 标题下的副标题 | `class="intro"` |
| “你的专属头像” | `class="card-top"` |
| “单指移动 · 双指缩放” | `class="adjustment"` |
| “挑一款，留下你的光”和款数 | `class="section-title"` |
| 四款相框的显示名称 | `class="frame-option"` 下的 `<span>` |
| “生成新头像”按钮 | `id="generate"` |
| 导出尺寸和本机处理说明 | `class="save-caption"` |
| 更换头像步骤 | `class="tips"` |
| “不上传照片，无需登录……” | `class="local-note"` |
| 底部隐私和复制链接按钮 | `<footer>` |
| 生成图弹窗标题 | `id="result-title"` |
| 长按保存说明 | `class="result-instruction"` |
| 下载按钮及备用保存说明 | `id="download"`、`class="dialog-note"` |
| 隐私弹窗正文 | `id="privacy-dialog"` |

改名称时，也建议同步按钮上的 `aria-label`，让辅助阅读工具读出的名称与显示一致。

**保留现有的 `id`、`class`、`data-frame` 等属性。** 例如可以修改“生成新头像”这几个字，但不要随意把 `id="generate"` 改掉，程序正是通过这个名字找到按钮的。

### 3.2 动态文字：编辑 app.js

部分文字虽然在 HTML 中也有初始值，但页面运行后会被 JavaScript 覆盖。只改 HTML 可能看起来没有生效。

| 动态内容 | 在 app.js 中搜索 |
| --- | --- |
| “从相册选择照片 / 换一张照片 / 正在处理…” | `updateControls()` |
| “已选择 / 试试看” | `querySelector('small')` |
| 选图后出现的“实时预览” | `preview-label` |
| 原图像素、清晰度提示 | `photo-hint` |
| “正在读取照片…”等状态提示 | `status(` |
| 图片读取、加载、生成失败提示 | 搜索对应的中文提示 |
| 下载文件名 | `$('download').download` |
| 未选图时，画布中的“让你的星光，在这里闪耀” | `fillText` |

实际下载文件名由程序设置：

```js
$('download').download = `一百零一夜-星光${selectedId}.png`;
```

`${selectedId}` 会替换为当前相框编号。只改 `index.html` 里下载按钮的 `download` 属性，不会改变最终运行时文件名。

## 4. 修改字号：编辑 styles.css

用编辑器搜索下表左列的选择器，修改其 `font-size`。这里是网页，字号用 **`px`**，不是小程序的 `rpx`。

| CSS 选择器 | 对应内容 | 当前字号 |
| --- | --- | --- |
| `.eyebrow` | 顶部书院与学生节名称 | `16px` |
| `h1` | “一百零一夜”大标题 | `clamp(36px, 6vw, 56px)` |
| `h1 span` | 标题右边的星形 | `0.7em`，相对大标题 |
| `.intro` | 标题下的副标题 | `16px` |
| `h2` | 通用小标题，包括预览标题、选框标题 | `16px` |
| `.card-top span` | “先选一张喜欢的照片 / 实时预览” | `12px` |
| `.canvas-status` | 预览加载中的文字 | `14px` |
| `.adjustment, .zoom-row` | 操作提示、缩放标签和百分比 | `13px` |
| `.text-button` | 重置、底部按钮、弹窗关闭按钮 | `14px` |
| `.choose, .primary` | 选照片、生成、下载按钮 | `16px` |
| `.photo-hint` | 原图尺寸与清晰度提示 | `12px` |
| `.section-title > span` | “共 4 款头像框” | `12px` |
| `.frame-option span` | “星光 01”等相框名称 | `12px` |
| `.frame-option small` | “已选择 / 试试看” | `11px` |
| `.save-caption` | 导出规格说明 | `12px` |
| `.status` | 选图、生成等进度与失败提示 | `14px` |
| `.share-notice` | 点击复制链接后的浮动提示 | `14px` |
| `.tips h2` | 更换头像说明标题 | `15px` |
| `.tips p` | 更换头像步骤正文 | `13px` |
| `.local-note` | 无需登录等说明 | `12px` |
| `.dialog-top h2` | 两个弹窗的标题 | `20px` |
| `dialog p` | 弹窗正文，包括长按提示 | `14px` |
| `.dialog-note` | 下载备用方式小字 | `12px` |

`clamp(36px, 6vw, 56px)` 表示标题随窗口宽度变化，但最小 36px、最大 56px。`em` 相对于当前字体大小；`vw` 相对于浏览器窗口宽度。

### 常见调整示例

把副标题改为 18px：

```css
.intro {
  color: var(--muted);
  font-size: 18px;
  line-height: 1.7;
}
```

只放大生成按钮，不影响选图和下载按钮，可以在 `styles.css` 末尾添加：

```css
#generate {
  font-size: 20px;
}
```

只放大“你的专属头像”和选框区标题：

```css
.card-top h2,
.section-title h2 {
  font-size: 18px;
}
```

只放大底部按钮：

```css
footer .text-button {
  font-size: 16px;
}
```

不要只修改通用的 `h2` 就以为所有小标题都会一起变化：`.tips h2`、`.dialog-top h2` 有自己的字号，会覆盖通用设置。

同一个 CSS 规则出现多次时，后面的同等优先级规则通常覆盖前面的；`#generate` 这样的 ID 规则比 `.primary` 这样的类规则优先级更高。建议优先修改原有规则，少量局部调整再放到末尾，避免积累大量重复设置。

### 只调整手机上的文字

当前 `@media (max-width: 760px)` 是手机 / 窄屏规则。可在文件末尾追加：

```css
@media (max-width: 760px) {
  .intro { font-size: 18px; }
  .card-top span { font-size: 14px; }
}
```

这样只影响宽度不超过 760px 的页面。改变字号后，应检查标题是否换行、按钮文字是否挤出、四款相框名称能否放下。

## 5. 修改字体、粗细、行距与字间距

### 全站字体

`styles.css` 开头的 `:root` 中有：

```css
font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
```

浏览器从左到右寻找设备上可用的字体。这里没有下载或内置字体文件，所以不同手机显示可能略有不同；最后的 `sans-serif` 由设备选择合适的无衬线字体。

如果只想让大标题使用宋体风格，可以添加：

```css
h1 {
  font-family: "Songti SC", "SimSun", serif;
}
```

设置字体名称不会自动安装字体。如果要所有设备使用同一款字形，需要提供允许网页使用的字体文件，并通过 `@font-face` 引入，同时留意字体授权、文件体积和首次加载速度。

### 常用文字属性

| 属性 | 作用 | 示例 |
| --- | --- | --- |
| `font-size` | 文字大小 | `18px` |
| `font-family` | 字体 | `"Microsoft YaHei", sans-serif` |
| `font-weight` | 粗细 | `400` 常规，`600` 较粗，`700` 加粗 |
| `line-height` | 行高 | `1.8` 表示字号的 1.8 倍 |
| `letter-spacing` | 字间距 | `.08em` |
| `color` | 字色 | `#34233f` |
| `text-align` | 对齐方式 | `left`、`center`、`right` |

### 画布中的文字需要单独修改

空白预览中的提示文字由 `app.js` 的 `draw()` 绘制：

```js
context.font = '36px "Microsoft YaHei", sans-serif';
context.fillText('让你的星光，在这里闪耀', 512, 630);
```

这里的 36px 是 **1024 像素画布内的字号**，不是手机屏幕上的最终字号。预览会整体缩小，所以显示出来更小。更改 `styles.css` 的字体不会改变这段画布文字。它只出现在没有照片时，不会添加到用户最终头像上。

## 6. 修改颜色

`styles.css` 开头定义了全局颜色：

| 变量 | 当前值 | 用途 |
| --- | --- | --- |
| `--paper` | `#f5f0fa` | 页面底色 |
| `--ink` | `#34233f` | 主要文字 |
| `--muted` | `#766181` | 次要文字 |
| `--accent` | `#7c4ea6` | 主按钮、选中边框、焦点和滑块 |
| `--soft` | `#eee4fa` | 浅色按钮和部分浅色背景 |
| `--line` | `#e4d9ec` | 弹窗边框 |

例如修改 `--accent`，使用 `var(--accent)` 的部分就会一起更新。但页面还有独立写死的颜色，想完整换主题还要检查：

- `body` 的渐变背景；`h1 span` 的星形颜色。
- `.choose` 的文字颜色、`.frame-option img` 的缩略图底色。
- `.tips`、`.tips h2`、`.tips p` 的背景和文字。
- `.status` 的错误提示色，`.result-instruction` 的长按提示色。
- `app.js` 中 `draw()` 的 `fillStyle`：画布底色不会跟随 CSS 自动改变。
- `index.html` 中 `name="theme-color"`：部分手机浏览器工具栏使用的主题色。

头像框本身的颜色属于 PNG 图片内容，更换 CSS 颜色不会改变头像框图案。

## 7. 修改布局、间距、按钮和预览尺寸

| CSS 选择器 / 属性 | 当前作用 |
| --- | --- |
| `.page` 的 `width` | 页面最大宽度 1024px |
| `.page` 的 `padding` | 整页上下、左右留白 |
| `.heading` 的 `margin-bottom` | 标题区与内容区距离 |
| `.workspace` 的 `grid-template-columns` | 电脑端预览和操作区为 `1.15fr 1fr` 两列 |
| `.workspace` 的 `gap` | 两个区域之间的间距 |
| `.editor-card` 的 `padding` | 预览卡片内部留白 |
| `.preview` 的 `aspect-ratio: 1` | 预览保持正方形 |
| `.frame-grid` 的 `grid-template-columns` | 四款头像框一行四列 |
| `.choose, .primary` 的 `padding` | 选图、生成、下载按钮的内部留白，影响按钮高度 |
| `.primary` 的 `margin-top` | 主按钮上方间距 |
| `border-radius` | 对应元素的圆角大小 |
| `dialog` 的 `width`、`max-height` | 弹窗宽度和最大高度 |

`padding` 是元素里面的空隙，`margin` 是元素外面的距离，`gap` 是排列项之间的距离。

当前宽度大于 760px 时为两列；不超过 760px 时为单列，手机页面最大宽度 520px。手机规则位于 `styles.css` 最后的 `@media (max-width: 760px)` 中，部分值会覆盖前面的通用规则。

**页面预览的显示大小，与导出图片像素大小是两件事。** 调整页面宽度或卡片留白不会改变最终导出的 1024 × 1024 像素。

## 8. 替换、改名或新增头像框

### 替换现有四款

直接替换 `assets/frames/` 中对应的文件：

- `frame-N.png`：用于预览和最终合成，当前为 1024 × 1024 透明 PNG。
- `thumb-N.png`：用于下面的选框列表，是对应相框的小图。

`N` 为 1、2、3、4。保持文件名不变即可继续使用；两类文件都要更新，避免列表和实际合成不一致。头像框中心应透明，否则会挡住用户照片。不要把 JPG 直接改名为 PNG。

仅替换相框文件不会自动修改显示名称；名称在 `index.html` 的 `<span>` 和 `aria-label` 中。

### 新增第 5 款

1. 添加 `frame-5.png` 和 `thumb-5.png`。
2. 在 `index.html` 的 `.frame-grid` 中复制一个相框按钮。
3. 将该按钮的 `data-frame` 改为 `5`，缩略图路径改为 `./assets/frames/thumb-5.png`，名称和 `aria-label` 改为对应名称；初始 `aria-pressed` 设为 `false`。
4. 将“共 4 款头像框”改为“共 5 款头像框”。
5. 检查四列布局：第 5 款会换到第二行。可按需要调整 `.frame-grid` 的列数，但应在手机上确认缩略图不会过小。

`app.js` 会自动寻找所有带 `data-frame` 的按钮，并按编号读取 `frame-N.png`，不需要单独写第 5 款的点击处理。

### 更改默认头像框

当前默认第 1 款。若要改为第 2 款，需同步调整：

- `app.js` 顶部的 `selectedId = 1` 改为 `2`。
- `init()` 中的 `loadFrame(1)` 改为 `loadFrame(2)`。
- `index.html` 初始选中状态：第 1 款 `aria-pressed="false"`，第 2 款为 `true`，对应小字改为“试试看 / 已选择”。

## 9. 导出清晰度、缩放和照片限制

### 导出尺寸

当前输出 1024 × 1024 PNG。改尺寸时，需要同步修改：

1. `app.js` 顶部的 `const SIZE = 1024`。
2. `index.html` 中预览画布 `canvas` 的 `width`、`height`。
3. 页面 `.save-caption` 的尺寸文字。
4. 生成图 `<img id="result-image">` 的 `width`、`height`，保持宽高比一致。

`draw()` 中空白头像示意图和提示文字的位置采用固定的 1024 画布坐标，如果大幅改变尺寸，也要按比例调整。选择更高清的相框原图才能增加相框细节；单纯放大已有 1024px 素材不会创造新细节。原照片偏小时同样如此。

### 缩放范围

目前为 **50%～400%**。若要改范围，需同步修改：

- `index.html` 中 `id="zoom"` 的 `min`、`max`。
- `geometry.mjs` 中 `constrain()`、`zoomAt()` 两处 `clamp(..., .5, 4)`。

未选择照片时，预览区域允许手机滑动页面。选好照片后，`updateControls()` 会设置画布的 `data-has-avatar="true"`，CSS 随之启用 `touch-action: none`，让手势用于拖动与缩放头像。不要把所有画布固定设置为 `touch-action: none`，否则空预览会挡住页面滑动。

当前允许把照片自由拖出边界，也允许缩小到不足以铺满画布；露出的部分使用画布底色填充。

### 照片限制

在 `app.js` 的选图处理处：

- 文件上限：`25 * 1024 * 1024`，即 25 MB。
- 原始图片像素上限：`48000000`，即 4800 万像素。
- 读取后保留的最长边最多 4096 像素，以减少后续处理内存。

这些限制用于避免手机内存占用过高。支持哪些图片格式取决于浏览器能否解码；读取失败时建议转为 JPG、PNG 或 WebP。

## 10. 手机长按保存：维护时特别注意

已针对安卓微信的保存失败调整过生成方式：

- `FileReader.readAsDataURL(blob)` 将生成图转换为包含 PNG 数据的 `data:image/png;base64,...`。
- `result-image` 的 `src` 使用这份内嵌图片数据，供手机长按保存。
- 下载按钮使用 `URL.createObjectURL(blob)` 产生的临时地址。
- 更换生成图时释放旧下载地址，防止反复生成积累内存。

**不要为了简化代码，将 `result-image.src` 重新改成下载按钮使用的 Blob 地址。** 之前在安卓微信中出现过“能预览、能弹出保存菜单，但保存失败”，切换为内嵌 PNG 预览后，用户已反馈测试通过。

保留 `.result-image` 的 `-webkit-touch-callout: default`，不要给结果图增加阻止长按菜单的处理。长按应在点击“生成新头像”后的图片弹窗中操作，编辑区画布用于拖动调整。

## 11. 本机预览与检查

建议使用 VS Code 打开整个项目文件夹，安装 Live Server 扩展后，对 `index.html` 选择 **Open with Live Server**。也可以在已安装 Node.js 的终端运行：

```powershell
cd D:\Code\Frame_chage_online
npx --yes http-server . -p 4173 -c-1
```

首次运行会从 npm 下载预览工具，需要网络。打开 <http://localhost:4173/>，结束时在终端按 `Ctrl+C`。这个预览服务不会修改网页源码；正式线上运行不依赖它。

不建议直接双击 `index.html`：浏览器对本地文件模块脚本和图片导出可能有限制。

修改交互或生成逻辑后，可以运行：

```powershell
node --check app.js
node --check geometry.mjs
node --test tests/image-export.test.cjs
```

现有测试覆盖生成图片数据、下载内容、重复生成，以及导出、读取、解码失败后的处理。它不检查文字布局、所有手势或手机微信的真实保存能力。

改完文字、样式后，至少在手机上检查换行和按钮；改完相框或导出逻辑后，再检查选图、拖动、缩放、切换、生成和保存。

## 12. 更新到公网

当前仓库通过 GitHub Pages 从 `main` 分支根目录发布，没有自定义 Actions 工作流，也不需要 `npm run build`。

确认本机效果后，在项目目录操作：

```powershell
git status
# 下面按本次实际修改的文件填写，不需要每次都添加所有文件：
git add index.html styles.css app.js geometry.mjs assets README.md
git commit -m "docs: update website maintenance guide"
git push origin main
```

提交说明应改为本次实际内容，例如 `style: enlarge mobile text`。若改动了测试，也要将测试文件加入提交。提交前查看 `git diff`，确认修改内容正确。

推送后，打开仓库的 **Actions** 查看 Pages 构建部署结果，等待完成后再用正式网址查看。仅保存本机文件不会自动更新公网网站。网址保持不变时，之前制作的二维码和海报也无需重新制作。

### 手机仍看到旧内容

1. 确认这次修改已经提交、推送，且 Pages 部署成功。
2. 关闭网页重新进入，或使用浏览器刷新。
3. 修改脚本时，可以同步更新 `index.html` 中的脚本版本，例如：

```html
<script type="module" src="./app.js?v=20261121-save2"></script>
```

4. 修改 CSS 时，同样可给样式链接增加或更新版本：

```html
<link rel="stylesheet" href="./styles.css?v=20261121-style2">
```

5. 若修改 `geometry.mjs` 仍遇到缓存，可在 `app.js` 导入路径上增加相应版本参数。相框图片也可能缓存，必要时统一更新缩略图和合成图的资源版本或文件名，并同步修改引用。

版本参数用于让浏览器重新请求资源，不能代替等待部署完成。

## 13. 常见疑问

**为什么改了按钮文字，网页还是显示原来的？**

先检查是否改错了项目目录，再看这段文字是否在 `app.js` 中动态设置，最后确认已推送、部署、刷新。

**为什么改了 `h2`，弹窗标题大小没变？**

弹窗使用 `.dialog-top h2` 的独立规则，优先修改对应选择器。其他特殊小标题也可能覆盖通用设置。

**为什么改了全站字体，预览中的字没变？**

画布文字在 `app.js` 的 `context.font` 中单独设置。

**为什么相框列表变了，生成的相框没变？**

缩略图和合成图是两个文件，需要同时更新 `thumb-N.png` 和 `frame-N.png`，再检查缓存。

**用户上传的照片在哪里？**

没有上传，照片只在用户当前浏览器内处理。刷新页面后要重新选图；本工具无法替用户找回未保存的结果。

**这个项目里有之前的二维码海报吗？**

当前二维码和海报产物保存在 `D:\Code\Mini_App\output`，没有放在这个网页仓库中。它们链接到正式网址；仅修改网页内容不影响其入口。
