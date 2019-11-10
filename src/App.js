import React from 'react';
import './App.css';
import axios from 'axios';
import * as Babel from '@babel/standalone';

import { baseScriptCode, baseJsxCode, baseCssCode } from './baseCode';

const getUUid = () => Number(Math.random().toString().substr(2, 5) + Date.now()).toString(36);

const uploadFileToOSSUrl = 'https://1556981199176880.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/react-online-edit/createFileAndUploadToOSS/';

const jsxCodeTransform = (input) => {
  return Babel.transform(input, { presets: ['react', 'es2015'] }).code;
};

class App extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        jsxCode: baseJsxCode,
        cssCode: baseCssCode,
        initTransFormCode: '', // 初始注入到 Iframe 的代码
      }
    }
    componentDidMount() {
      this.loadCodeFromOss();
    }

    // 加载初始代码
    initRunCode = () => {
      const { jsxCode, cssCode } = this.state;
      const transFormJsxCode = this.transFormJsxCode(jsxCode);
      const initTransFormCode = `
        <style id="online-css">${cssCode}</style>
        ${baseScriptCode}
        <script>${transFormJsxCode}</script>
      `;
      this.setState({
        initTransFormCode
      });
    }

    // 获取远程源代码加载
    loadCodeFromOss = () => {
      const { pathname } = window.location;
      // 当进入初始url时
      if (pathname === "/") {
        const uuid = getUUid();
        window.history.pushState(null, null, `/${uuid}`);
        this.initRunCode();
      } else {
        // 当 pathname 不为空，请求数据
        axios({
          method: 'get',
          url: `http://officespace2.oss-cn-beijing.aliyuncs.com${pathname}.json`
        }).then(res => {
          const { jsxCode, cssCode } = res.data;
          this.setState({
            jsxCode,
            cssCode
          }, () => {
            this.initRunCode();
          })
        })
      }
    }

    // 将源代码（未经编译）传入OSS
    uploadOriginCodeToOss = () => {
      const { pathname } = window.location;
      const { jsxCode, cssCode } = this.state;
      const fileName = `${pathname.slice(1, pathname.length)}.json`;
      this.uploadFile(fileName, JSON.stringify({
        jsxCode,
        cssCode
      })).then((res) => {
        console.log(res);
      })
    }

    // 编译 Jsx 代码
    transFormJsxCode = (input) => {
      try {
        const outputCode = jsxCodeTransform(input);
        return outputCode
      } catch(e) {
        console.log(e);
      }
    }

    // 保存代码：1. 传入到iframe；2.保存到OSS
    handleSaveCode = (e, type) => {
      if (e.keyCode === 83 && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
        e.preventDefault();
        this.postCodeToIframe(type);
        this.uploadOriginCodeToOss();
      }
    }

    // 绑定 input
    handleInputCode = (e, type) => {
      this.setState({
        [type]: e.target.value
      })
    }

    // 将 js、css 传入 Iframe 中
    postCodeToIframe = (type) => {
      const { cssCode, jsxCode } = this.state;
      const transFormJsxCode = this.transFormJsxCode(jsxCode);
      if (type === 'jsxCode') {
        document.getElementById("preview").contentWindow.postMessage({
          type: 'jsxCode',
          content: transFormJsxCode
        });
      } else if (type === 'cssCode') {
        document.getElementById("preview").contentWindow.postMessage({
          type: 'cssCode',
          content: cssCode
        });
      }
    }

    // 发布页面
    handleSharePage = () => {
      const { pathname } = window.location;
      const filePreName = `${pathname.slice(1, pathname.length)}`;
      const { cssCode, jsxCode } = this.state;
      const transformJsxCode = this.transFormJsxCode(jsxCode);
      Promise.all([this.uploadFile(`${filePreName}.js`, transformJsxCode), this.uploadFile(`${filePreName}.css`, cssCode)]).then(res => {
        console.log(`${window.location.origin}/share${pathname}`);
      })
    }

    // 上传文件
    uploadFile = (fileName, fileContent) => {
      return axios({
        method: 'post',
        url: uploadFileToOSSUrl,
        data: {
          fileName: fileName,
          content: fileContent
        }
      })
    }


    render() {
        const { jsxCode, cssCode, initTransFormCode } = this.state;
        return (
            <div>
                <button onClick={this.handleSharePage}>share</button>
                <div style={{display: 'flex'}}>
                  <div>
                    <textarea onKeyDown={ (e) => { this.handleSaveCode(e, 'jsxCode') } } style={{width: 500, height: 300,}} value={jsxCode} onChange={(e) => { this.handleInputCode(e, 'jsxCode') }}>
                    </textarea>
                  </div>
                  <div>
                    <textarea onKeyDown={ (e) => { this.handleSaveCode(e, 'cssCode') } } style={{width: 500, height: 300,}} value={cssCode} onChange={(e) => { this.handleInputCode(e, 'cssCode') }}>
                    </textarea>
                  </div>
                </div>
                <div><button onClick={this.handleRunCode}>run</button></div>
                <iframe
                  width={600}
                  height={500}
                  title="online"
                  id="preview"
                  srcDoc={initTransFormCode}
                />
            </div>
        )
    }
}

export default App;
