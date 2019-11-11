export const baseScriptCode = `
  <script src="https://cdn.bootcss.com/react/16.10.2/umd/react.production.min.js"></script>
  <script src="https://cdn.bootcss.com/react-dom/16.10.2/umd/react-dom.production.min.js"></script>
  <div id="root">root</div>
  <script>
    window.addEventListener('message',function(event){
      console.log(event);
      var type = event.data.type;
      var content = event.data.content;
      if (type === 'jsxCode') {
        eval(content);
      }
      if (type === 'cssCode') {
        document.getElementById("online-css").innerHTML = content
      }
    }, false);
  </script>
`

export const baseJsxCode = `
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
        <h1>Hello this is a Online Editor</h1>
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

export const baseCssCode = `
    body {
      color: red;
    }
`