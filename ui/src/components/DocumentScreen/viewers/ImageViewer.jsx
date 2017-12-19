import React, { Component } from 'react';

import './ImageViewer.css';

class ImageViewer extends Component {
  render() {
    const { links } = this.props;
    if (!links || !links.file) {
        return null;
    }

    return (
      <div className="ImageViewer">
        <img src={links.file} />
      </div>
    );
  }
}

export default ImageViewer;
