import React, { Component } from 'react';
import { Link } from 'react-router-dom';
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
        {(pageNumber > 1) &&
          <Link to={{ hash: `page=${pageNumber-1}` }}>Previous</Link>
        }
        {(pageNumber < numPages) &&
          <Link to={{ hash: `page=${pageNumber+1}` }}>Next</Link>
        }
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
