import React, { Component } from 'react';
import { Document, Page } from 'react-pdf/build/entry.webpack';
import { findLast } from 'lodash';

import { parse as parsePdfFragId } from 'src/util/pdfFragId';

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
    const { url, fragId } = this.props;
    const { numPages } = this.state;

    let pageNumber = getPageNumber(fragId);
    if (pageNumber === undefined) pageNumber = 1;

    return (
      <div className="PdfViewer">
        <Document file={url} onLoadSuccess={this.onDocumentLoad.bind(this)}>
          <Page
            pageNumber={pageNumber}
            className="page"
          />
        </Document>
      </div>
    );
  }
}

export default PdfViewer;

function getPageNumber(fragId) {
  const pageParameter = findLast(
    parsePdfFragId(fragId),
    { parameter: 'page' },
  );
  return pageParameter && pageParameter.pagenum;
}
