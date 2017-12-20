import React, { Component } from 'react';

import './ImageViewer.css';

class ImageViewer extends Component {
  render() {
    const { document } = this.props;
    if (!document.links || !document.links.file) {
        return null;
    }

    return (
      <div className="ImageViewer">
        <img src={document.links.file} alt={document.file_name} />
      </div>
    );
  }
}

export default ImageViewer;
