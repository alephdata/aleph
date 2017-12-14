import React, { Component } from 'react';

class TextViewer extends Component {
  render() {
    const { text } = this.props;
    return (
      <pre>{text}</pre>
    );
  }
}

export default TextViewer;
