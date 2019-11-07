import React from 'react';
import './App.css';
import throttle from 'lodash/throttle';
import * as Babel from '@babel/standalone';

const baseScript = `
  <script src="https://cdn.bootcss.com/react/16.10.2/umd/react.production.min.js"></script>
  <script src="https://cdn.bootcss.com/react-dom/16.10.2/umd/react-dom.production.min.js"></script>
  <div id="root">root</div>
  <script>
    window.addEventListener('message',function(event){
      console.log(event);
      var type = event.data.type;
      var content = event.data.content;
      if (type === 'jsx') {
        eval(content);
      }
      if (type === 'css') {
        document.getElementById("online-css").innerHTML = content
      }
    }, false);
  </script>
`

const baseJsxCode = `
  const Test = () => { return (<div>this is test Component</div>) }
  class App extends React.Component {
    constructor(props) {
      super(props)
      this.state = {
        value: 'Hello!'
      }
      this.handleChange = this.handleChange.bind(this)
    }
    handleChange(event) {
      this.setState({ value: event.target.value });
    }
    render() {
      var value = this.state.value;
      return (
        <div>
          <input type="text" value={value} onChange={this.handleChange} />
          <p>{value}</p>
          <Test />
        </div>
      );
    }
  }
  ReactDOM.render(
    <App />,
    document.getElementById('root')
  );
`

const baseCssCode = `
    body {
      color: red;
    }
`

const jsxCodeTransform = (input) => {
  return Babel.transform(input, { presets: ['react', 'es2015'] }).code;
};

class App extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        jsxCode: baseJsxCode,
        cssCode: baseCssCode,
        transFormCode: '',
      }
    }
    componentDidMount() {
      this.initRunCode();
    }

    transFormJsxCode = (input) => {
      try {
        const outputCode = jsxCodeTransform(input);
        return outputCode
      } catch(e) {
        console.log(e);
      }
    }

    handleCodeInputJsx = (e) => {
        var input = e.target.value;
        this.setState({
          jsxCode: input
        },this.handlePostJsxToIframe);
    }

    handleCodeInputCss = (e) => {
      var input = e.target.value;
      this.setState({
        cssCode: input
      }, this.handlePostCssToIframe);
    }

    initRunCode = () => {
      const { jsxCode, cssCode } = this.state;
      const transFormJsxCode = this.transFormJsxCode(jsxCode);
      const allCode = `
        <style id="online-css">${cssCode}</style>
        ${baseScript}
        <script>${transFormJsxCode}</script>
      `;
      this.setState({
        transFormCode: allCode
      });
    }

    handlePostCssToIframe = throttle(() => {
      const { cssCode } = this.state;
      document.getElementById("preview").contentWindow.postMessage({
        type: 'css',
        content: cssCode
      });
    }, 2000)

    handlePostJsxToIframe = throttle(() => {
      const { jsxCode } = this.state;
      const transFormJsxCode = this.transFormJsxCode(jsxCode);
      document.getElementById("preview").contentWindow.postMessage({
        type: 'jsx',
        content: transFormJsxCode
      });
    }, 2000)
    render() {
        const { jsxCode, cssCode, transFormCode } = this.state;
        return (
            <div>
                <div style={{display: 'flex'}}>
                  <div>
                    <textarea style={{width: 500, height: 300,}} value={jsxCode} onChange={this.handleCodeInputJsx}>
                    </textarea>
                  </div>
                  <div>
                    <textarea style={{width: 500, height: 300,}} value={cssCode} onChange={this.handleCodeInputCss}>
                    </textarea>
                  </div>
                </div>
                <div><button onClick={this.handleRunCode}>run</button></div>
                <iframe
                  width={600}
                  height={500}
                  title="online"
                  id="preview"
                  srcDoc={transFormCode}
                />
            </div>
        )
    }
}

export default App;
