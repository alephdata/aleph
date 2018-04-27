import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { Document, Page } from 'react-pdf/dist/entry.webpack';
import { FormattedMessage } from 'react-intl';
import { throttle } from 'lodash';
import queryString from 'query-string';
import classNames from 'classnames';

import Query from 'src/app/Query';
import getPath from 'src/util/getPath';
import { SectionLoading } from 'src/components/common';
import { queryDocumentRecords, fetchDocumentPage } from 'src/actions';
import { selectDocumentRecordsResult, selectDocumentPage } from 'src/selectors';

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
    this.setState({ numPages: pdfInfo.numPages });

    if (this.props.onDocumentLoad) {
      this.props.onDocumentLoad(pdfInfo);
    }

    // Handle a resize event (to check document width) after loading
    // Note: onDocumentLoad actualy happens *before* rendering, but the
    // rendering calls happen a bit too often as we don't have sophisticated
    // shouldComponentUpdate code in this component.
    this.onResize();

    this.resizeTimeout = setTimeout(() => {
      // We only want to do anything if the size *has not* been calculated yet.
      // This is because rendering a PDF can change it slightly but we don't
      // want to flash the entire PDF render (as it's slow) just to change
      // it by a 1 or 2 pixels.
      this.onResize();
    }, 350);
  }

  componentDidMount() {
    this.fetchRecords();
    this.fetchPage();
    this.onResize();
    window.addEventListener("resize", throttle(this.onResize, 500))
  }

  componentWillUnmount() {
    clearTimeout(this.resizeTimeout);
    window.removeEventListener("resize", throttle(this.onResize, 500))
  }

  componentDidUpdate(prevProps) {
    const { document, page, query } = this.props;
    if (this.state.width === null) {
      this.onResize();
    }
    if (this.props.mode !== prevProps.mode) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.onResize();
      }, 350);
    }
    if (!query.sameAs(prevProps.query)) {
      this.fetchRecords();
    }
    if (document.id !== prevProps.document.id || page !== prevProps.page) {
      this.fetchPage();
    }
  }

  fetchRecords() {
    const { query, result, isSearch } = this.props;
    if (result.total === undefined && !result.isLoading && isSearch) {
      this.props.queryDocumentRecords({query})
    }
  }

  fetchPage() {
    const { document, page, pageResult } = this.props;
    if (pageResult.id === undefined && !pageResult.isLoading) {
      this.props.fetchDocumentPage({documentId: document.id, page});
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
      search: queryString.stringify({documentq: query.getString('q')}),
      hash: `page=${res.index}&mode=view`
    });
  }
  
  render() {
    const { document, mode, page, pageResult, result, isSearch } = this.props;
    const { width, numPages } = this.state;

    if (document.id === undefined) {
      return null;
    }

    if (isSearch && result.total === undefined) {
      return <SectionLoading />;
    }

    return (
      <div className="PdfViewer">
        <div className="outer">
          <div id="PdfViewer" className="inner">
            { mode === 'text' && (
              <div className="document">
                {pageResult.id !== undefined && (
                  <pre>{pageResult.text}</pre>
                )}
                {pageResult.id === undefined && (
                  <SectionLoading />
                )}
              </div>
            )}
            { mode === 'view' && (
              <div className="document">
                {result.total === 0 && (
                  <div className="pt-callout pt-intent-warning pt-icon-search">
                    <FormattedMessage id="document.search.no_match"
                                      defaultMessage="No page within this document matches your search." />
                  </div>
                )}
                {(!isSearch || result.total === 0) && (
                  <div ref={(ref) => this.pdfElement = ref}>
                    <Document renderAnnotations={true}
                              file={document.links.pdf}
                              loading={<SectionLoading />}
                              onLoadSuccess={this.onDocumentLoad}>
                    {/* 
                        Only render Page when width has been set and numPages has been figured out.
                        This limits flashing / visible resizing when displaying page for the first time.
                    */}
                    {width !== null && numPages > 0 && (
                      <Page pageNumber={page}
                            className="page"
                            width={width} />
                    )}
                    </Document>
                  </div>
                )}
                {isSearch && (
                  <div className="pages">
                    <ul>
                      {result.results.map((res, index) => (
                        <li key={`page-${res.id}`}>
                          <p>
                            <a onClick={(e) => this.onSearchResultClick(e, res)} className={classNames({active: page === res.index})}>
                              <span className={`pt-icon-document`}/> Page {res.index}
                            </a>
                          </p>
                          <p>
                            { res.highlight !== undefined && (
                              <span dangerouslySetInnerHTML={{__html: res.highlight.join('  …  ')}} />
                            )}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { document, location, queryText, previewMode } = ownProps;
  const hashQuery = queryString.parse(location.hash);
  const page = parseInt(hashQuery.page, 10) || 1;

  const path = document.links ? document.links.records : null;
  const context = { 
    highlight: true,
    highlight_count: 10,
    highlight_length: 120
  };
  let query = Query.fromLocation(path, location, context, 'document').limit(50);

  if (queryText.length > 0) {
    query = query.setString('q', queryText);
  }

  const mode = hashQuery.mode || 'view';
  return {
    result: selectDocumentRecordsResult(state, query),
    pageResult: selectDocumentPage(state, document.id, page),
    isSearch: (previewMode && query.hasQuery() && mode === 'view') || (mode === 'search'),
    page: page,
    mode: mode === 'search' ? 'view' : mode,
    query: query
  }
}

PdfViewer = connect(mapStateToProps, { queryDocumentRecords, fetchDocumentPage })(PdfViewer);
PdfViewer = withRouter(PdfViewer);
export default PdfViewer