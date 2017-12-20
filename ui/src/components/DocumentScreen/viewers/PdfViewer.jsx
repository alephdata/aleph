import React, { Component } from 'react';
import { Document, Page } from 'react-pdf/build/entry.webpack';
import { range } from 'lodash';

import './PdfViewer.css';

class PdfViewer extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  onDocumentLoad(pdfInfo) {
    this.setState({
      numPages: pdfInfo.numPages
    });
  }

  render() {
    const { url } = this.props;
    const { numPages } = this.state;
    return (
      <div className="PdfViewer">
        <Document file={url} onLoadSuccess={this.onDocumentLoad.bind(this)}>
          {range(numPages).map(pageIndex => {
            return (
              <Page
                key={`p${pageIndex}`}
                pageIndex={pageIndex}
                className="page"
              />
            );
          })}
        </Document>
      </div>
    );
  }
}

export default PdfViewer;
