import React = require("react");

import falafel from "./falafel";
import LoopInserter from "./loop-inserter";
import makeImplicitSketch from "./implicit-sketch";
import PureComponent from "./pure-component";
import * as PreviewFrame from "./preview-frame-interface";

const LOOP_CHECK_FUNC_NAME = '__loopCheck';

interface Props {
  p5version: string,
  width: number,
  content: string,
  baseSketchURL: string,
  timestamp: number,
  textOutput: boolean,
  gridOutput: boolean,
  soundOutput: boolean,
  onError: PreviewFrame.ErrorReporter
}

interface State {

}

export default class Preview extends PureComponent<Props, State> {
  _iframe: HTMLIFrameElement

  resetIframe() {
    let content = this.props.content;

    content = makeImplicitSketch(content);

    try {
      content = falafel(content, {}, LoopInserter(function(node) {
        return LOOP_CHECK_FUNC_NAME + "(" +
               JSON.stringify(node.range) + ");";
      })).toString();
    } catch (e) {
      // There's almost definitely a syntax error in the user's code;
      // just leave it unmangled and let the preview frame bubble up
      // the error.
    }

    if (this._iframe) {
      this._iframe.parentNode.removeChild(this._iframe);
      this._iframe = null;
    }
    let iframe = document.createElement('iframe');

    iframe.setAttribute('src', 'preview-frame.html');
    iframe.setAttribute('title', 'p5 output');
    iframe.setAttribute('aria-label', 'p5 output');
    iframe.setAttribute('width', this.props.width.toString());
    iframe.addEventListener('load', () => {
      // Note that this should never be called if we're already unmounted,
      // since that means the iframe will have been removed from the DOM,
      // in which case it shouldn't be emitting events anymore.
      if(this.props.textOutput) {
        var iframeDocument = iframe.contentDocument;
        var textSection = iframeDocument.createElement("section");
        textSection.setAttribute('id','textOutput-content');
        iframeDocument.body.appendChild(textSection);
        iframe.focus();
      }
      if(this.props.gridOutput) {
        var iframeDocument = iframe.contentDocument;
        var gridSection = iframeDocument.createElement("section");
        gridSection.setAttribute('id','gridOutput-content');
        iframeDocument.body.appendChild(gridSection);
        iframe.focus();
      }
      if(this.props.soundOutput) {
        var iframeDocument = iframe.contentDocument;
        var soundSection = iframeDocument.createElement("section");
        soundSection.setAttribute('id','soundOutput-content');
        iframeDocument.body.appendChild(soundSection);
      }
      let frame = iframe.contentWindow as PreviewFrame.Runner;
      frame.startSketch(content, this.props.p5version, 1000,
                        LOOP_CHECK_FUNC_NAME,
                        this.props.baseSketchURL,
                        this.props.onError);
    });
    this.refs.container.appendChild(iframe);

    // debugger;
    this._iframe = iframe;


  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevProps.timestamp !== this.props.timestamp) {
      this.resetIframe();
    }
  }

  componentDidMount() {
    this.resetIframe();
    console.log('mounted');
  }

  componentWillUnmount() {
    this._iframe = null;
  }

  refs: {
    [key: string]: (Element)
    container: HTMLDivElement
  }

  render() {
    return (
      <div>
        <div ref="container" className="preview-holder"></div>;
      </div>
    )
  }
}
