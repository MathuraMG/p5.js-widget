import React = require("react");

import PureComponent from "./pure-component";
import Toolbar from "./toolbar";
import Editor from "./editor";
import Preview from "./preview";
import { Autosaver } from "./autosaver";

interface ErrorMessage {
  message: string,
  line?: number
}

interface AppProps {
  initialContent: string,
  previewWidth: number,
  p5version: string,
  baseSketchURL: string,
  autosaver?: Autosaver,
  autoplay?: boolean
}

// Ugh, in practice, not all of these are truly optional, but we need
// to declare them as such in order to actually use setState() without
// ridiculous amounts of repetition.
//
// https://github.com/DefinitelyTyped/DefinitelyTyped/pull/4809
interface AppState {
  canUndo?: boolean,
  canRedo?: boolean,
  isPlaying?: boolean
  startPlayTimestamp?: number
  previewContent?: string
  editorContent?: string
  lastError?: ErrorMessage
  textOutput?: boolean
  gridOutput?: boolean
  soundOutput?: boolean
  isTextArea?: boolean
}

let ErrorMessage = (props: ErrorMessage) => (
  <div className="error-message">
    <span className="error-message-line">Line {props.line}:</span>
    {" " + props.message}
  </div>
);

export default class App extends PureComponent<AppProps, AppState> {
  constructor(props) {
    super(props);
    this.state = {
      canUndo: false,
      canRedo: false,
      textOutput: false,
      gridOutput: false,
      soundOutput: false,
      isTextArea: false,
      previewContent: this.props.initialContent,
      editorContent: this.props.initialContent
    };
  }

  componentDidMount() {
    let autosave = this.props.autosaver && this.props.autosaver.restore();

    if (autosave && autosave !== this.state.editorContent) {
      this.setState({ editorContent: autosave });
    } else if (this.props.autoplay) {
      this.handlePlayClick();
    }
  }

  handleEditorChange = (newValue: string, canUndo: boolean,
                        canRedo: boolean) => {
    this.setState({
      editorContent: newValue,
      canUndo: canUndo,
      canRedo: canRedo
    });
    this.props.autosaver.save(newValue);
  }

  handlePreviewError = (message: string, line?: number) => {
    this.setState({
      lastError: {
        message: message,
        line: line
      }
    });
  }

  handleRevertClick = () => {
    this.setState({
      isPlaying: false,
      editorContent: this.props.initialContent
    });
  }

  handlePlayClick = () => {
    this.setState((prevState, props) => ({
      isPlaying: true,
      previewContent: prevState.editorContent,
      startPlayTimestamp: Date.now(),
      lastError: null
    }));
  }

  toggleTextOutput = () => {
    this.setState({ textOutput: !this.state.textOutput });
    if(this.state.isPlaying) {
      this.handlePlayClick();
    }
  }

  toggleGridOutput = () => {
    this.setState({ gridOutput: !this.state.gridOutput });
    if(this.state.isPlaying) {
      this.handlePlayClick();
    }
  }

  toggleSoundOutput = () => {
    this.setState({ soundOutput: !this.state.soundOutput });
    if(this.state.isPlaying) {
      this.handlePlayClick();
    }
  }

  toggleTextArea = () => {
    this.setState({ isTextArea: !this.state.isTextArea });
  }

  handleStopClick = () => {
    this.setState({ isPlaying: false });
  }

  handleUndoClick = () => {
    this.refs.editor.undo();
  }

  handleRedoClick = () => {
    this.refs.editor.redo();
  }

  refs: {
    [key: string]: (any),
    editor: Editor
  }

  render() {
    let errorLine = null;
    let canRevert = (this.state.editorContent !== this.props.initialContent);

    if (this.state.lastError &&
        this.state.editorContent === this.state.previewContent) {
      errorLine = this.state.lastError.line;
    }

    return (
      <div className="app">
        <Toolbar
         onPlayClick={this.handlePlayClick}
         onStopClick={this.state.isPlaying && this.handleStopClick}
         onUndoClick={this.state.canUndo && this.handleUndoClick}
         onRedoClick={this.state.canRedo && this.handleRedoClick}
         onRevertClick={canRevert && this.handleRevertClick}
         toggleTextOutput = {this.toggleTextOutput}
         toggleGridOutput = {this.toggleGridOutput}
         toggleSoundOutput = {this.toggleSoundOutput}
         toggleTextArea = {this.toggleTextArea}
         isTextArea = {this.state.isTextArea}
        />
        <div className="panes">
          <Editor ref="editor"
                  content={this.state.editorContent}
                  errorLine={errorLine}
                  onChange={this.handleEditorChange}
                  isTextArea = {this.state.isTextArea} />
          <div className="preview-holder-wrapper">
          {this.state.isPlaying
            ? <Preview content={this.state.previewContent}
                       baseSketchURL={this.props.baseSketchURL}
                       p5version={this.props.p5version}
                       width={this.props.previewWidth}
                       timestamp={this.state.startPlayTimestamp}
                       onError={this.handlePreviewError}
                       textOutput = {this.state.textOutput}
                       gridOutput = {this.state.gridOutput}
                       soundOutput = {this.state.soundOutput}
                       />
            : null}
          </div>
        </div>
        <div className="status-bar">
          {this.state.lastError
           ? <ErrorMessage {...this.state.lastError} />
           : null}
        </div>
      </div>
    );
  }
}
