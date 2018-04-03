import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { Spinner } from '@blueprintjs/core';
import { Document, Page } from 'react-pdf/dist/entry.webpack';
import { throttle, debounce } from 'lodash';
import queryString from 'query-string';
import classNames from 'classnames';

import Query from 'src/app/Query';
import { queryDocumentRecords } from 'src/actions';
import { selectDocumentRecordsResult } from 'src/selectors';
import SectionLoading from 'src/components/common/SectionLoading';

import './PdfViewer.css';

class PdfViewer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      width: null,
      numPages: 0,
      searchResults: null,
      fetchedRecords: false,
      selectedRecords: false
    };
    this.onDocumentLoad = this.onDocumentLoad.bind(this);
    this.onResize =  debounce(this.onResize.bind(this), 500);
    this.updateSearchResults =  debounce(this.updateSearchResults.bind(this), 100);
  }

  onDocumentLoad(pdfInfo) {
    this.setState({
      numPages: pdfInfo.numPages
    });

    if (this.props.onDocumentLoad)
      this.props.onDocumentLoad(pdfInfo)
  }
  
  componentWillReceiveProps(newProps) {
    if (newProps.queryText !== this.props.queryText) {
      this.setState({ 
        searchResults: null,
        fetchedRecords: false,
        selectedRecords: false,
        numPages: 0
      });
      this.updateSearchResults();
    }
  }
  
  componentDidMount() {
    this.onResize();
    this.fetchRecords();
    window.addEventListener("resize", throttle(this.onResize, 1000))
  }

  componentWillUnmount() {
    window.removeEventListener("resize", throttle(this.onResize, 1000))
  }
  
  componentDidUpdate() {
    this.updateSearchResults();
  }

  fetchRecords() {
    const { queryDocumentRecords, query } = this.props;
    if (query.path) {
      queryDocumentRecords({query})
    }
  }

  /*
   * @FIXME
   * Putting the state into props.state in mapStateToProps and calling 
   * updateSearchResults() every time the component updates is basically 
   * a hack because the there is something up with our lifecycle whereby 
   * we don't get updated search results the first time a new search is
   * performed.
   *
   * This approach of setting fetchedRecords to false in 
   * componentWillReceiveProps and then calling updateSearchResults(), 
   * then parsing the result works around the problem but is hard to follow.
   *
   * We should really invest the time to understand what is wrong with our 
   * lifecycle that is causing this bug, though that requires a bit more
   * time sunk into figuring out why we don't just get new props when a new
   * query is made by fetchRecords()
   */
  updateSearchResults() {
    const { state, query, queryText, location: loc } = this.props;
    const { fetchedRecords, selectedRecords } = this.state;
    
    if (fetchedRecords === false) {
      this.setState({ fetchedRecords: true });
      this.fetchRecords();
      return;
    }
    
    if (selectedRecords === false) {
      const hash = queryString.parse(loc.hash);
      const results = (queryText) ? selectDocumentRecordsResult(state, query) : null;

      const searchResults = {
        isLoading: (results) ? results.isLoading : false,
        results: []
      };
    
      if (results !== null) {
        results.results.map((result) => {
          if (!result || !result.index)
            return false;
          
          hash.page = result.index
          searchResults.results.push({
            pageNumber: result.index,
            href: `#${queryString.stringify(hash)}`
          })
          return true;
        });
      }
      
      this.setState({
        selectedRecords: (results && results.isLoading === false) ? true : false,
        searchResults: searchResults
      });
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

  render() {
    const { document, session, queryText, hash } = this.props;
    const { width, numPages, searchResults } = this.state;

    const pageNumber = (hash.page && parseInt(hash.page, 10) <= numPages) ? parseInt(hash.page, 10) : 1;

    if (!document || !document.links || !document.links.pdf) {
      return null;
    }

    const displayPdf = (queryText) ? false : true;
    const displayPdfWithSearchResults = (queryText && numPages > 0) ? true : false;
    
    if (displayPdf === true) {
      let fileUrl = document.links.pdf;
      if (session.token) {
        fileUrl = `${fileUrl}?api_key=${session.token}`;
      }
    
      return (
        <React.Fragment>
          <div className="PdfViewer">
            <div className={classNames("outer", { 'with-search-results': displayPdfWithSearchResults })}>
              <div className="pages">
                <div className="heading">Found on:</div>
                {displayPdfWithSearchResults === true && (searchResults === null || searchResults.isLoading === true) &&
                  <Spinner className="pt-small spinner" />
                }
                {displayPdfWithSearchResults === true &&
                  <ul>
                    {searchResults !== null && searchResults.isLoading === false && searchResults.results.length === 0 &&
                      <li><span className="no-results pt-text-muted">No Results.</span></li>
                    }
                    {searchResults !== null && searchResults.results.length > 0 && searchResults.results.map((result, index) => (
                      <li key={`page-${index}`}><a href={result.href} className={classNames({active: pageNumber === result.pageNumber})}>Page {result.pageNumber}</a></li>
                    ))}
                  </ul>
                }
              </div>
              {displayPdf === true &&
                <div id="PdfViewer" className="inner">
                  <div className="document">
                    <div ref={(ref) => this.pdfElement = ref}>
                      {width && (
                        <Document renderAnnotations={true}
                                  file={fileUrl}
                                  onLoadSuccess={this.onDocumentLoad}
                                  loading={(<SectionLoading />)}>
                        <Page pageNumber={pageNumber} className="page" width={width}/>
                      </Document>
                      )}
                    </div>
                  </div>
                </div>
              }
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
                  <div className="heading">Found on:</div>
                  {(searchResults === null || searchResults.isLoading === true) &&
                    <Spinner className="pt-small spinner" />
                  }
                  <ul>
                    {searchResults !== null && searchResults.isLoading === false && searchResults.results.length === 0 &&
                      <li><span className="no-results pt-text-muted">No Results.</span></li>
                    }
                    {searchResults !== null && searchResults.results.length > 0 && searchResults.results.map((result, index) => (
                      <li key={`page-${index}`}><a href={result.href} className={classNames({active: pageNumber === result.pageNumber})}>Page {result.pageNumber}</a></li>
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
  const { document: doc, location: loc } = ownProps;

  const hash = queryString.parse(loc.hash);
  
  const qs = queryString.parse(loc.search);
  const path = doc.links ? doc.links.records : null;
  const query = Query.fromLocation(path, loc, { q: qs.q || null}, 'document').limit(50);
  
  return {
    state: state,
    session: state.session,
    query: query,
    queryText: qs.q || null,
    hash: queryString.parse(loc.hash)
  }
}

PdfViewer = connect(mapStateToProps, { queryDocumentRecords })(PdfViewer);

PdfViewer = withRouter(PdfViewer);

export default PdfViewer