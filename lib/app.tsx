import ReactDOM = require("react-dom");
import React = require("react");

import Editor from "./editor";
import Preview from "./preview";

let defaultSketchJS = require("raw!./default-sketch.js") as string;

require("../css/style.css");

interface AppProps {
}

interface AppState {
}

class App extends React.Component<AppProps, AppState> {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  onChange = (newValue: string) => {
    console.log("CHANGE", this);
  }

  onError = (message: string, line?: number) => {
    console.log("ERROR", message, "at line", line);
  }

  render() {
    return (
      <div>
        <Editor initialContent={defaultSketchJS}
                onChange={this.onChange} />
        <Preview content={defaultSketchJS} onError={this.onError} />
      </div>
    );
  }
}

ReactDOM.render(<App/>, document.getElementById('app'));
