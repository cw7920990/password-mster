# password-mster

一个静态的密码生成器网站（Password Master）。

## 使用方式

1. 本地打开
   - 直接用浏览器打开 `index.html` 即可使用。

2. 静态托管
   - 将整个项目目录上传到任意静态托管（GitHub Pages、Vercel、Netlify、阿里云OSS、七牛等）。
   - 入口文件是 `index.html`。

## 功能

- 自定义长度（8-64）
- 选择字符集（大小写、数字、符号）
- 排除相似字符
- 至少包含每种选择的字符类型
- 实时强度评估（估算熵）
- 一键复制

所有密码在浏览器端使用 `crypto.getRandomValues` 生成，不会上传到服务器。

## 开发

这是纯静态项目，无需构建工具。你也可以用 `Live Server` 类插件在本地起一个静态服务器便于调试。
