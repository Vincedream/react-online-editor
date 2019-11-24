## 前言

近几年前端发展迅速，很多概念性的想法渐渐地变成了现实，比如前端微服务、Serverless 在前端的应用、在线IDE编码等，越来越多“工程”级别的项目选择使用 Web 浏览器作为宿主平台，前端发展可谓如日中天，本篇文章选择在线IDE作为切入点，介绍其实现原理，并且动手写一个简易版本的 React 在线IDE。

## CodeSandBox

[CodeSandBox](https://codesandbox.io/) 是目前为止最为强大的在线 IDE 工具之一，他实现了 90% 的本地前端 IDE 工具的功能，以下是比较令人惊叹的几个特性：

1. 完全浏览器在线打包，实现了可在浏览器运行的 webpack 工具。
2. 可使用 npm 包
3. 支持文件系统
4. 可离线使用 
5. 可在线发布应用

是的，你没有看错，这一切都是发生在浏览器上，更为惊叹的是，CodeSanBox 是个人项目，并不是由专业的公司团队开发完成。其强大功能证明了，浏览器能够做的事情是无穷无尽的，下面我将简单讲解其结构以及实现方案。

![image](http://static4.vince.xin/WeChate987f08313e53d34abc458997a652daf.png)

其主要结构分为以下几个部分：

- Editor: 编辑器，这里集成了 VsCode，包含了大部分桌面版 VsCode 的主要功能(自动填充、光标提示、快捷键等)，当文件变动时，会通知 SandBox 进行编译。
- SandBox：这部分是 CodeSandBox 最核心的部分，它负责代码的转译，也就是最核心的 Webpack 在浏览器上的打包实现方案，用户编写的代码与用户所使用到的 npm 包源码，注入到转译的 Complier 中，转译完成的代码会注入 Iframe 中预览。
- Packager：包管理器，相当于浏览器版本的 npm、yarn 包管理器。
- Iframe：最后面是用来预览项目的内嵌 Iframe。

看似简单的实现方案，但是由于 CodeSandBox 的强大功能，因此其实现过程是非常复杂且具有挑战性的，因为浏览器并没有 Node 环境，并且 webpack 、npm、babel 对浏览器端使用并不是完全覆盖，甚至只是提供最基本的功能，还有需要克服的文件系统，这一切都需要大量的精力与时间，非常佩服与赞叹其作者，假如你想知道其具体的实现方案，以下资料推荐给你：

- 国内首篇讲解：[CodeSandbox 浏览器端的webpack是如何工作的？ 上篇](https://juejin.im/post/5d1e0dea51882514bf5bedfa#heading-1)
- 作者的博客： [Ives van Hoorne](https://hackernoon.com/@compuives)
- 项目开源地址：[codesandbox](https://github.com/codesandbox)

## 简易IDE需求

简单分析完 CodeSandBox 的实现方案，我们也能试着动手做一个简单的在线 IDE，我们需要实现以下基础功能：

1. 可编写 ES6、JSX 的 React 代码并预览
2. 可编写 CSS
3. 可保存源码数据
4. 可发布应用

这里，我放出我完成的项目，读者有兴趣可以进入下面地址试玩一下：[Online Editor](http://online.vince.xin/)

项目源码： [react-online-editor](https://github.com/Vincedream/react-online-editor)

## 实现方案

完成需求分析后，我列出了在我完成该 IDE 过程中给你遇到几个棘手的问题：

1. 在浏览器端如何转译 ES6、JSX 代码？
2. 如何实现预览功能
3. 如何完成编辑器的样式
4. 需要保证用户编写的代码数据持久化
5. 即时发布应用

### 总览分析

在解决上述问题，我们先对 Online Editor 的结构做一个讲解：

![image](http://static4.vince.xin/WeChat10f42ef16c117e1e72dd14a76599d0b0.png)

这是项目主要的结构，首先，用户编写代码后，Cmd/Ctrl + S 保存代码，触发 @babel/standalone 转译，这里将 ES6、JSX 的代码转译成 ES5 的可执行代码以及可可执行的 CSS 代码，注入到浏览器内嵌的 Iframe 中，使得 Iframe 刷新重新运行新的代码，同时，这一步我们会将用户编写的 Js、Css 代码以字符串的方式以一个唯一的 uuid 作为标识存入到 OSS 中，只要用户持有当前的 url，遍能访问到之前写的代码，这里我们便解决了上述的第1、2、4个问题。

用户编写完后，需要将其当前页面发布到线上环境，供其他人访问，这里我们看下面的分析结构图：

![image](http://static4.vince.xin/WeChatc0a10bf2c12d97c4517fc91605caaa92.png)

当我们点击发布按钮时，将转译后的 js 与 Css 代码存入到 OSS 中，以 `<script>` `<link>` 的方式注入到发布页面，这里我们完成了上述的第 5 个问题。

最后我们借助 [CodeMirror](https://github.com/codemirror/CodeMirror)，实现了编辑器的样式与交互，也完成了第 3 个问题。

### 源码实现

#### 转译 ES6、JSX

我们借助强大的 babel 生态中的 `@babel/standalone`，这是能够在浏览器上运行的转译 babel 工具，只需要简单的配置便能实现转译功能：

```
const jsxCodeTransform = (input) => {
  return Babel.transform(input, {
    presets: ['react', 'es2015'] // 基础配置
  }).code;
};
```
这里我们需要注意，这个转译的过程计算量是非常大的，我们需要控制其触发频率，甚至可以单独开一个 `work`执行该函数。

#### CodeMirror

这是个集成多种编程语言的浏览器编辑器组件，支持多种主题：

```
<CodeMirror
    value={jsxCode}
    className="code-container"
    options={{
        mode: 'jsx',
        theme: 'material',
        lineNumbers: true
    }}
    onBeforeChange={(editor, data, value) => {
        this.handleInputCode(value, 'jsxCode')
    }}
    onKeyDown={(editor, event) => { this.handleSaveCode(event, 'jsxCode') }}
/>
```

#### Iframe 信息传递

我们通过 postMessage 将转译的代码传入 Iframe 中：

```
// 将 js、css 传入 Iframe 中
postCodeToIframe = (type) => {
  const { cssCode, jsxCode } = this.state;
  const transFormJsxCode = this.transFormJsxCode(jsxCode);
  if (type === 'jsxCode') {
    document.getElementById("preview").contentWindow.postMessage({
      type: 'jsxCode',
      content: transFormJsxCode
    }, "*");
  } else if (type === 'cssCode') {
    document.getElementById("preview").contentWindow.postMessage({
      type: 'cssCode',
      content: cssCode
    }, "*");
  }
}
```

#### 渲染发布页面

这里我们使用 Node.js 的 express 框架，配合 EJS 模版，非常简单地实现了一个服务器渲染的 `html`:

```
// server.js
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/share/:pageId', (req, res, next) => {
    res.render('index', {pageId: req.params.pageId})
})
```

/
```
// index.ejs
<!DOCTYPE html>
<html>
  <head>
    <title><%= pageId %></title>
    <script src="https://cdn.bootcss.com/react/16.10.2/umd/react.production.min.js"></script>
    <script src="https://cdn.bootcss.com/react-dom/16.10.2/umd/react-dom.production.min.js"></script>
    <link rel="stylesheet" href="http://officespace2.oss-cn-beijing.aliyuncs.com/<%= pageId %>.css">
  </head>
  <body>
    <div id="root">loading...</div>
    <script src="http://officespace2.oss-cn-beijing.aliyuncs.com/<%= pageId %>.js"></script>
  </body>
</html>
```

我们需要注意的是，这里预置了 `react` 、 `react-dom`，这里只需要将转译后的业务代码注入即可。

完整的源码： [react-online-editor](https://github.com/Vincedream/react-online-editor)

## 接口 Serverless 化

这里我们用到了上传源码文件的接口，为了避免 OSS 的密钥直接暴露在前端，这里我做了一个接口在后端进行统一处理，后端接收到文件名和文件字符串后，会生成相应的文件，然后传入到 OSS 中，由于其不具备依赖性、用完即走的特性，我将其接口直接写在了阿里云的云函数中，也就是我们说的 **Serverless**，可实现随用随调、可承受高并发、按需收费等优良特性。

## TODO

通过上面的讲解，我们完成了一个非常简配的在线 IDE ，实现了非常基础的功能，当然还是有非常多不足的地方，也是接下来需要优化的 TodoList：

- 通过分析源码的 AST ，来支持浏览器的文件引用
- 通过 unpkg、Systemjs 等方案实现可引入 npm 包功能
- 实现 Css 的预处理功能(Scss、less...)

## 总结

本篇博文并没有讲解很高深的知识，只是给了读者一种实现 IDE 方案，希望能够给到读者一些启示，实现一个完整的浏览器 IDE 工程量是巨大的，虽然如此，我们还是有必要去了解其基本的实现方案，对将来遇到的需求也不会一脸懵的尴尬情况。

**项目源码**： [react-online-editor](https://github.com/Vincedream/react-online-editor)

**Refs**：[CodeSandbox 浏览器端的webpack是如何工作的？ 上篇](https://juejin.im/post/5d1e0dea51882514bf5bedfa#heading-1)
