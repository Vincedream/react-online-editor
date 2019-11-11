import React from 'react';
import {Controlled as CodeMirror} from 'react-codemirror2';
import axios from 'axios';
import classnames from 'classnames';
import * as Babel from '@babel/standalone';
import { baseScriptCode, baseJsxCode, baseCssCode } from './baseCode';
import jsIcon from './icon/js.png';
import cssIcon from './icon/css.png';
import browserIcon from './icon/browser.png';
import loadingIcon from './icon/loading.png';
import dotIcon from './icon/dot.png';

import './App.css';
require('codemirror/lib/codemirror.css');
require('codemirror/theme/material.css');
require('codemirror/mode/javascript/javascript.js');
require('codemirror/mode/jsx/jsx.js');
require('codemirror/mode/css/css.js');


const getUUid = () => Number(Math.random().toString().substr(2, 5) + Date.now()).toString(36);

const uploadFileToOSSUrl = 'https://1556981199176880.cn-shanghai.fc.aliyuncs.com/2016-08-15/proxy/react-online-edit/createFileAndUploadToOSS/';

const jsxCodeTransform = (input) => {
  return Babel.transform(input, { presets: ['react', 'es2015'] }).code;
};

const TabList = [
  {
    key: 'jsxCode',
    iconImg: jsIcon,
    title: 'App.js'
  },
  {
    key: 'cssCode',
    iconImg: cssIcon,
    title: 'App.css'
  },
]

class App extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        jsxCode: baseJsxCode,
        cssCode: baseCssCode,
        initTransFormCode: '', // 初始注入到 Iframe 的代码
        cssCodeSaved: true,
        jsxCodeSaved: true,
        tabSelected: TabList[0].key, // 
        isPublished: false, // 是否已经发布过
        isPublishLoading: false, // 是否正在发布页面
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
        }).catch(() => {
          this.initRunCode();
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
        this.setState({
          [`${type}Saved`]: true
        })
      }
    }

    // 绑定 input
    handleInputCode = (value, type) => {
      this.setState({
        [type]: value,
        [`${type}Saved`]: false
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
      this.setState({
        isPublishLoading: true
      })
      const { pathname } = window.location;
      const filePreName = `${pathname.slice(1, pathname.length)}`;
      const { cssCode, jsxCode } = this.state;
      const transformJsxCode = this.transFormJsxCode(jsxCode);
      const sharePageUrl = `${window.location.origin}/share${pathname}`;
      Promise.all([this.uploadFile(`${filePreName}.js`, transformJsxCode), this.uploadFile(`${filePreName}.css`, cssCode)]).then(res => {
        this.setState({
          isPublished: true,
          isPublishLoading: false
        });
        window.open(sharePageUrl)
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

    handleChangeTab = (key) => {
      this.setState({
        tabSelected: key
      })
    }
    render() {
        const { isPublished, isPublishLoading, jsxCode, cssCode, tabSelected, cssCodeSaved, jsxCodeSaved, initTransFormCode } = this.state;
        const { pathname } = window.location;
        const sharePageUrl = `${window.location.origin}/share${pathname}`;
        return (
            <div className="app-page">
              <div className="code-layout">
                <div className="tab-wrap">
                  {TabList.map(item => (
                    <div key={item.key} onClick={() => { this.handleChangeTab(item.key) }} className={classnames("tab-item", { "tab-item--selected": item.key ===  tabSelected})}>
                      <img className="tab-icon" src={item.iconImg} alt="" />
                      {item.title}
                      {((item.key === 'jsxCode' && !jsxCodeSaved) || (item.key === 'cssCode' && !cssCodeSaved)) && <img className="dot-icon" src={dotIcon} alt=""/>}
                    </div>
                  ))}
                  <div className="reload-tips">Tips: Cmd/Ctrl + S to reload</div>
                </div>
                <div className="code-wrap">
                  {tabSelected === 'jsxCode' && <CodeMirror
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
                  />}
                  {tabSelected === 'cssCode' && <CodeMirror
                    value={cssCode}
                    className="code-container"
                    options={{
                        mode: 'css',
                        theme: 'material',
                        lineNumbers: true
                    }}
                    onBeforeChange={(editor, data, value) => {
                        this.handleInputCode(value, 'cssCode')
                    }}
                    onKeyDown={(editor, event) => { this.handleSaveCode(event, 'cssCode') }}
                  />}
                </div>
              </div>
              <div className="browser-layout">
                <div className="browser-header">
                  <img className="browser-icon" src={browserIcon} alt=""/>
                  <div className="url-container">
                    {isPublished ? sharePageUrl : 'http://localhost (click publish button to show url)'}
                    {isPublishLoading && <img src={loadingIcon} className="loading-icon" alt=""/>}
                  </div>
                  <span onClick={this.handleSharePage} className="share-button">发布</span>
                </div>
                <div className="browser-wrap">
                  <iframe
                    className="preview-browser"
                    title="online"
                    id="preview"
                    srcDoc={initTransFormCode}
                  />
                </div>
              </div>
            </div>
        )
    }
}

export default App;
