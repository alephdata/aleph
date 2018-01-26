import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Document, Page } from 'react-pdf/build/entry.webpack';
import { findLast, throttle } from 'lodash';

import { parse as parsePdfFragId } from 'src/util/pdfFragId';

import './PdfViewer.css';

function getPageNumber(fragId) {
  const pageParameter = findLast(
    parsePdfFragId(fragId),
    { parameter: 'page' },
  );
  return pageParameter && pageParameter.pagenum;
}

class PdfViewer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      width: null
    };
  }

  onDocumentLoad(pdfInfo) {
    this.setState({
      numPages: pdfInfo.numPages
    });
  }

  componentDidMount () {
    this.setWidth()
    window.addEventListener("resize", throttle(this.setWidth, 500))
  }

  componentWillUnmount () {
    window.removeEventListener("resize", throttle(this.setWidth, 500))
  }

  setWidth = () => {
    if (this.pdfElement) {
      this.setState({
        width: this.pdfElement.getBoundingClientRect().width
      })
    }
  }

  render() {
    const { url, fragId, session } = this.props;
    const { numPages, width } = this.state;
    const fileInfo = {url: url};

    if (session.token) {
      fileInfo['httpHeaders'] = {
        'Authorization': `Bearer ${session.token}`
      }
    }

    let pageNumber = getPageNumber(fragId);
    if (pageNumber === undefined) pageNumber = 1;

    return (
      <div className="PdfViewer">
        <div className="pt-button-group pt-fill">
          <Link to={{ hash: `page=${pageNumber-1}` }}><button className="pt-button pt-icon-arrow-left" disabled={pageNumber <= 1}/></Link>
          <button className="pt-button pt-fill" disabled={true}>{pageNumber} of {numPages}</button>
          <Link to={{ hash: `page=${pageNumber+1}` }}><button className="pt-button pt-icon-arrow-right" disabled={pageNumber >= numPages}/></Link>
        </div>

        <div className="document_pdf"  ref={(ref) => this.pdfElement = ref}>
          <Document renderAnnotations={true} file={fileInfo} onLoadSuccess={this.onDocumentLoad.bind(this)}>
            <Page pageNumber={pageNumber} className="page" width={width} />
          </Document>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {session: state.session};
}
export default connect(mapStateToProps)(PdfViewer);
