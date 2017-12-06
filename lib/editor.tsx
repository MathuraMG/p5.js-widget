import React = require("react");

import CodeMirror = require("codemirror");

import "codemirror/mode/javascript/javascript.js";

import PureComponent from "./pure-component";

// It seems like CodeMirror behaves oddly with a flexbox layout, so
// we will manually size it. However, Chrome seems to have a bug
// whereby we need to wait a bit before resizing it after the
// component initially mounts (this isn't required for Firefox or MS Edge).
const INITIAL_RESIZE_DELAY_MS = 100;

interface Props {
  content?: string
  errorLine?: number
  isTextArea?: boolean
  onChange?: (newValue: string, canUndo: boolean, canRedo: boolean) => void
}

interface State {
}

export default class Editor extends PureComponent<Props, State> {
  _cm: CodeMirror.Editor
  _resizeTimeout: number
  _errorLineHandle: any

  componentDidUpdate(prevProps: Props) {
    if(this.props.isTextArea != prevProps.isTextArea) {
      if(this.props.isTextArea) {
        this.setToTextArea();
      } else {
        this.setToCodeMirror();
      }
    }
    if (this.props.content !== prevProps.content &&
        this.props.content !== this._cm.getValue()) {
      this._cm.setValue(this.props.content);
    }
    if (this.props.errorLine !== prevProps.errorLine) {
      if (this._errorLineHandle) {
        this._cm.removeLineClass(this._errorLineHandle, 'background',
                                 'error-line');
        this._errorLineHandle = null;
      }
      if (this.props.errorLine) {
        this._errorLineHandle = this._cm.addLineClass(
          this.props.errorLine - 1,
          'background',
          'error-line'
        );
      }
    }
  }

  setToTextArea() {
    this._cm.toTextArea();
    let textEditor = document.getElementById("textarea");
    textEditor.addEventListener('keyup', () => {
      const oldLine = document.getElementById('current-line').innerHTML;
      const currentLine = (String)(textEditor.value.substr(0, textEditor.selectionStart).split("\n").length);
      if(currentLine.localeCompare(oldLine)!=0) {
        document.getElementById('current-line').innerHTML = currentLine;
      }
    })
  }

  setToCodeMirror() {
    this._cm = CodeMirror.fromTextArea(document.getElementById("textarea"), {
      theme: 'p5-widget',
      value: this.props.content,
      lineNumbers: true,
      mode: 'javascript',
      inputStyle: 'contenteditable',
    });
    this._cm.on('change', () => {
      if (this.props.onChange) {
        let size = this._cm.getDoc().historySize();
        this.props.onChange(this._cm.getValue(),
                            size.undo > 0, size.redo > 0);
      }
    });
    this._cm.on('keyup', () => {
      const oldLine = document.getElementById('current-line').innerHTML;
      const currentLine = `line ${parseInt((this._cm.getCursor().line) + 1, 10)}`;
      if(currentLine.localeCompare(oldLine)!=0) {
        document.getElementById('current-line').innerHTML = currentLine;
      }
    });
    this.resizeEditor();
    this._resizeTimeout = setTimeout(this.resizeEditor,
                                     INITIAL_RESIZE_DELAY_MS);
    window.addEventListener('resize', this.resizeEditor, false);
  }

  componentDidMount() {
    this.setToCodeMirror();
  }

  componentWillUnmount() {
    // CodeMirror instances have no remove/destroy methods, so we
    // don't need to do anything: http://stackoverflow.com/a/18890324/2422398
    this._cm = null;
    clearTimeout(this._resizeTimeout);
    window.removeEventListener('resize', this.resizeEditor, false);
  }

  undo() {
    this._cm.getDoc().undo();
  }

  redo() {
    this._cm.getDoc().redo();
  }

  resizeEditor = () => {
    let wrapper = this._cm.getWrapperElement();
    let oldDisplay = wrapper.style.display;

    // We need to get the size of our container when it's
    // "uncorrupted" by the height of our codemirror widget, so
    // temporarily hide the widget.
    wrapper.style.display = 'none';

    let rectHeight = this.refs.container.getBoundingClientRect().height;

    wrapper.style.display = oldDisplay;

    this._cm.setSize(null, rectHeight);
  }

  // http://stackoverflow.com/a/33826399/2422398
  refs: {
    [key: string]: (Element)
    container: HTMLDivElement
  }

  render() {
    return (
      <div ref="container" className="editor-holder">
        <textarea id="textarea" defaultValue={this.props.content} onChange={()=>{this.props.onChange(document.getElementById('textarea').value)}}>
        </textarea>
      </div>
    )
;
  }
}
