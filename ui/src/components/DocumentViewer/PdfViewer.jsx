import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { Document, Page } from 'react-pdf/dist/entry.webpack';
import { throttle } from 'lodash';
import queryString from 'query-string';
import classNames from 'classnames';

import SectionLoading from 'src/components/common/SectionLoading';

import './PdfViewer.css';

class PdfViewer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      width: null,
      numPages: 0
    };
    this.onDocumentLoad = this.onDocumentLoad.bind(this);
  }

  onDocumentLoad(pdfInfo) {
    this.setState({
      numPages: pdfInfo.numPages
    });
    
    if (this.props.onDocumentLoad)
      this.props.onDocumentLoad(pdfInfo)

    // This handles a rare race condition where the page is slow to render
    // on initial load - it makes sure it pops to the size as soon as it can
    // (otherwise on first render the first page viewed may appear too small).
    setTimeout(() => {
      this.updateWidth();
    }, 1000);
  }

  componentDidMount() {
    this.updateWidth();
    window.addEventListener("resize", throttle(this.updateWidth, 500))
  }

  componentWillUnmount() {
    window.removeEventListener("resize", throttle(this.updateWidth, 500))
  }
  
  componentWillUpdate() {
    this.updateWidth();
  }

  updateWidth = () => {
    const PdfViewerElement =  window.document.getElementById('PdfViewer');
    const width = (PdfViewerElement) ? PdfViewerElement.getBoundingClientRect().width : null;
    if (width !== null && width !== this.state.width) {
      this.setState({
        width: width
      })
    }
  };

  render() {
    const { document, session, location: loc } = this.props;
    const { numPages, width } = this.state;
    
    if (!document || !document.links || !document.links.pdf) {
      return null;
    }

    const pagesVisible = false;

    let url = document.links.pdf;
    if (session.token) {
      url = `${url}?api_key=${session.token}`;
    }

    const parsedHash = queryString.parse(loc.hash);
    let pageNumber = (parsedHash.page && parseInt(parsedHash.page, 10) <= numPages) ? parseInt(parsedHash.page, 10) : 1;
    
    return (
      <React.Fragment>
        <div className="PdfViewer">
          <div className={classNames("outer", { 'with-page-list': pagesVisible })}>
            <div className="pages">
              <ul>
                <li>
                  Result number on page 1
                </li>
                <li>
                  Result number on page 2
                </li>
              </ul>
            </div>
            <div className="inner">
              <div id="PdfViewer" className="document" style={{minWidth: width}}>
                <div ref={(ref) => this.pdfElement = ref}>
                  {width && (
                  <Document renderAnnotations={true}
                            file={url}
                            onLoadSuccess={this.onDocumentLoad}
                            loading={(<SectionLoading />)}>
                    <Page pageNumber={pageNumber} className="page" width={width}/>
                  </Document>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {session: state.session};
}

PdfViewer = connect(mapStateToProps)(PdfViewer);

PdfViewer = withRouter(PdfViewer);

export default PdfViewer