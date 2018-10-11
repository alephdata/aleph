import React, { Component } from 'react';

import './ImageViewer.css';


class ImageViewer extends Component {
  render() {
    const { document } = this.props;
    return (
      <div className="outer">
        <div className="inner ImageViewer">
          <img src={document.links.file} alt={document.file_name} />
        </div>
      </div>
    );
  }
}

export default ImageViewer