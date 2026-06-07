# TalkMate vendor 资源目录

此目录用于快速开发迭代阶段托管从 CDN 验证后下载到本地的静态资源。

## 使用原则

1. 开发验证阶段可以临时使用 CDN。
2. 一旦确认采用，必须下载到 `public/vendor/` 下本地托管。
3. 正式部署不依赖远程 CDN，避免公网不可用、版本漂移或企业网络拦截。
4. 资源必须锁定版本，并在本文件记录来源。

## 推荐目录

```txt
vendor/
  css/       通用 CSS reset、辅助样式
  js/        纯浏览器 JS 库
  fonts/     品牌字体与展示字体
  animate/   动画 CSS
  echarts/   图表库本地包
  icons/     补充图标或品牌图形
```

## 引入示例

在 `index.html` 中引入：

```html
<link rel="stylesheet" href="/vendor/animate/animate.min.css" />
<script defer src="/vendor/echarts/echarts.min.js"></script>
```

## CDN 转本地示例

```bash
mkdir -p frontend/public/vendor/animate
curl -L https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.min.css \
  -o frontend/public/vendor/animate/animate.min.css
```

## 当前资源清单

暂无已下载的第三方 vendor 资源。
