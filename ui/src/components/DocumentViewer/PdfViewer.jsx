import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { Document, Page } from 'react-pdf/dist/entry.webpack';
import { throttle } from 'lodash';
import queryString from 'query-string';
import classNames from 'classnames';

import Query from 'src/app/Query';
import getPath from 'src/util/getPath';
import { SectionLoading } from 'src/components/common';
import { queryDocumentRecords } from 'src/actions';
import { selectDocumentRecordsResult } from 'src/selectors';

import './PdfViewer.css';

class PdfViewer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      width: null,
      numPages: 0
    };
    this.onDocumentLoad = this.onDocumentLoad.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onSearchResultClick = this.onSearchResultClick.bind(this);
  }

  onDocumentLoad(pdfInfo) {
    this.setState({
      numPages: pdfInfo.numPages
    });

    if (this.props.onDocumentLoad)
      this.props.onDocumentLoad(pdfInfo)

    // Handle a resize event (to check document width) after loading
    // Note: onDocumentLoad actualy happens *before* rendering, but the
    // rendering calls happen a bit too often as we don't have sophisticated
    // shouldComponentUpdate code in this component.
    this.onResize();

    setTimeout(() => {
      // We only want to do anything if the size *has not* been calculated yet.
      // This is because rendering a PDF can change it slightly but we don't
      // want to flash the entire PDF render (as it's slow) just to change
      // it by a 1 or 2 pixels.
      if (this.state.width === null) {
        this.onResize();
      }
    }, 1000);
  }

  componentDidMount() {
    this.fetchRecords();
    this.onResize();
    window.addEventListener("resize", throttle(this.onResize, 1000))
  }

  componentWillUnmount() {
    window.removeEventListener("resize", throttle(this.onResize, 1000))
  }

  componentDidUpdate(prevProps) {
    if (this.state.width === null) {
      this.onResize();
    }
    if (!this.props.query.sameAs(prevProps.query)) {
      this.fetchRecords();
    }
  }

  fetchRecords() {
    const { queryDocumentRecords, query } = this.props;
    if (query.path) {
      queryDocumentRecords({query})
    }
  }
  
  onResize() {
    // Node we use a magic number to subtract scrollBarWidth (usually 15-17px) 
    // to avoid loops whereby it draws with and without a scrollbar (and keeps
    // resizing indefinitely) when displayed at specific sizes in preview mode.
    // We should refactor this out for a better solution wherby on the document
    // itself scrolls in the preview (and possibly in the normal view too).
    const scrollBarWidth = 20;
    const PdfViewerElement =  window.document.getElementById('PdfViewer');
    const width = (PdfViewerElement) ? parseInt(PdfViewerElement.getBoundingClientRect().width - scrollBarWidth, 10) : null;

    if (width !== null && width !== this.state.width) {
      this.setState({
        width: width - scrollBarWidth
      })
    }
  }

  onSearchResultClick(e, res) {
    const { document, history, query } = this.props;
    e.preventDefault();
    history.push({
      pathname: getPath(document.links.ui),
      search: queryString.stringify({documentprefix: query.getString('prefix')}),
      hash: `page=${res.index}`
    });
  }
  
  render() {
    const { document, hashQuery, previewMode, result, query } = this.props;
    const { width, numPages } = this.state;
    const pageNumber = (hashQuery.page && parseInt(hashQuery.page, 10) <= numPages) ? parseInt(hashQuery.page, 10) : 1;

    if (document.id === undefined) {
      return null;
    }

    const searchMode = hashQuery['mode'] === 'search' && query.hasQuery();
    const searchPreview = previewMode && (query.hasQuery() && (result.isLoading || result.total > 0));
    const displayPdf = !searchMode && !searchPreview;

    if (displayPdf === true) {
      return (
        <React.Fragment>
          <div className="PdfViewer">
            <div className="outer">
              <div id="PdfViewer" className="inner">
                <div className="document">
                  <div ref={(ref) => this.pdfElement = ref}>
                      <Document
                        renderAnnotations={true}
                        file={document.links.pdf}
                        onLoadSuccess={this.onDocumentLoad}>
                      {/* 
                          Only render Page when width has been set and numPages has been figured out.
                          This limits flashing / visible resizing when displaying page for the first time.
                      */}
                      {width !== null && numPages > 0 && (
                        <Page pageNumber={pageNumber} className="page" width={width}/>
                      )}
                    </Document>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </React.Fragment>
      );
    } else {
      return (
        <React.Fragment>
          <div className="PdfViewer">
            <div className="outer">
              <div className="search-results">
                <div className="pages">
                  {result.total === undefined && <SectionLoading /> }
                  {result.total !== undefined && result.results.length === 0 &&
                    <p className="no-results pt-text-muted">No results.</p>
                  }
                  <ul>
                    {result !== null && result.results.length > 0 && result.results.map((res, index) => (
                      <li key={`page-${res.id}`}>
                        <p>
                          <a onClick={(e) => this.onSearchResultClick(e, res)} className={classNames({active: pageNumber === res.index})}>
                            <span className={`pt-icon-document`}/> Page {res.index}
                          </a>
                        </p>
                        <p>
                          <a onClick={(e) => this.onSearchResultClick(e, res)} className="pt-text-muted">
                            { res.highlight !== undefined && (
                              <span dangerouslySetInnerHTML={{__html: res.highlight.join('  …  ')}} />
                            )}
                          </a>
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </React.Fragment>
      );
    }
  }
}

const mapStateToProps = (state, ownProps) => {
  const { document, location, queryText } = ownProps;

  const path = document.links ? document.links.records : null;
  const context = { 
    highlight: true,
    highlight_count: 10,
    highlight_length: 120
  };
  let query = Query.fromLocation(path, location, context, 'document').limit(50);

  if (queryText.length > 0) {
    query = query.setString('prefix', queryText);
  }
  
  return {
    result: selectDocumentRecordsResult(state, query),
    hashQuery: queryString.parse(location.hash),
    query: query
  }
}

PdfViewer = connect(mapStateToProps, { queryDocumentRecords })(PdfViewer);
PdfViewer = withRouter(PdfViewer);
export default PdfViewer