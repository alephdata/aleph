import React, { Component } from 'react';

import SectionLoading from 'src/components/common/SectionLoading';

import './ImageViewer.css';

class ImageViewer extends Component {
  render() {
    const { document } = this.props;
    if (!document.links || !document.links.file) {
        return <SectionLoading />;
    }

    return (
      <React.Fragment>
        <div className="ImageViewer">
          <img src={document.links.file} alt={document.file_name} />
        </div>
      </React.Fragment>
    );
  }
}

export default ImageViewer;
