import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Document, Page } from 'react-pdf/build/entry.webpack';
import { findLast, throttle } from 'lodash';

import SectionLoading from 'src/components/common/SectionLoading';
import DocumentToolbar from 'src/components/common/DocumentToolbar/DocumentToolbar';
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
      width: null,
      numPages: 0
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
    const { document, fragId, session } = this.props;
    const { numPages, width } = this.state;

    if (!document || !document.links || !document.links.pdf) {
      return null;
    }

    let url = document.links.pdf;
    if (session.token) {
      url = `${url}?api_key=${session.token}`
    }

    let pageNumber = getPageNumber(fragId);
    if (pageNumber === undefined) pageNumber = 1;

    return (
      <React.Fragment>
        <DocumentToolbar document={document} pageNumber={pageNumber} pageTotal={numPages}/>
        <div className="DocumentContent PdfViewer">
          <div className="document_pdf" ref={(ref) => this.pdfElement = ref}>
            <Document renderAnnotations={true}
                      file={url}
                      onLoadSuccess={this.onDocumentLoad.bind(this)}
                      loading={(<SectionLoading />)}>
              <Page pageNumber={pageNumber} className="page" width={width} />
            </Document>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {session: state.session};
}
export default connect(mapStateToProps)(PdfViewer);
