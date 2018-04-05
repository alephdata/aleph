import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { Spinner } from '@blueprintjs/core';
import { Document, Page } from 'react-pdf/dist/entry.webpack';
import { throttle, debounce } from 'lodash';
import queryString from 'query-string';
import classNames from 'classnames';

import Query from 'src/app/Query';
import getPath from 'src/util/getPath';
import { queryDocumentRecords } from 'src/actions';
import { selectDocumentRecordsResult } from 'src/selectors';
import SectionLoading from 'src/components/common/SectionLoading';
import { DocumentSearch } from 'src/components/Toolbar';

import './PdfViewer.css';

class PdfViewer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      documentSearchQueryText: props.queryText,
      width: null,
      numPages: 0,
      searchResults: null,
      fetchedRecords: false,
      selectedRecords: false
    };
    this.onDocumentLoad = this.onDocumentLoad.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onSearchQueryChange = this.onSearchQueryChange.bind(this);
    this.onSubmitDocumentSearch = this.onSubmitDocumentSearch.bind(this);
    this.updateSearchResults =  debounce(this.updateSearchResults.bind(this), 100);
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
    
    // @FIXME As a bit of a hack, resize event (to check document width) 1 
    // second after the document has loaded.
    //
    // This will mostly do nothing, because nothing will have changed - which 
    // is fine, but in practice in a simple way to trigger once after a short 
    // delay to allow time for the view to do a first render.
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
  
  componentWillReceiveProps(newProps) {
    if (newProps.queryText !== this.props.queryText) {
      this.setState({
        documentSearchQueryText: newProps.queryText,
        searchResults: null,
        fetchedRecords: false,
        selectedRecords: false,
        numPages: 0
      });
      if (this.props.onDocumentLoad)
        this.props.onDocumentLoad(null)
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
    if (this.state.width === null) {
      this.onResize();
    }
  }

  fetchRecords() {
    const { queryDocumentRecords, query, location: loc } = this.props;
    const { documentSearchQueryText } = this.state;
    
    if (query.path) {
      if (query.context) {
        query.context.q = documentSearchQueryText;
      }
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
    const { state, query, queryText, document: doc, location: loc } = this.props;
    const { fetchedRecords, selectedRecords, documentSearchQueryText } = this.state;
    
    if (fetchedRecords === false) {
      this.setState({ fetchedRecords: true });
      this.fetchRecords();
      return;
    }
    
    if (selectedRecords === false) {
      const hash = queryString.parse(loc.hash);
      
      if (query.context) {
        query.context.q = documentSearchQueryText;
      }

      const results = (documentSearchQueryText) ? selectDocumentRecordsResult(state, query) : null;

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
            id:  Math.random().toString(36).substr(2, 9),
            pageNumber: result.index,
            href: `#${queryString.stringify(hash)}`,
            to: `${getPath(doc.links.ui)}#page=${result.index}`,
            highlight: result.highlight
          })

          return true;
        });
      }
      
      this.setState({
        selectedRecords: (results && results.isLoading === false || documentSearchQueryText === null) ? true : false,
        searchResults: searchResults
      });
      return;
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

  onSearchQueryChange(queryText) {
    const { documentSearchQueryText } = this.state;
    if (queryText !== documentSearchQueryText) {
      this.setState({
        documentSearchQueryText: queryText || '',
        searchResults: null,
        fetchedRecords: false,
        selectedRecords: false,
        numPages: 0
      });
      
      this.updateSearchResults();
    }
  }
  
  onSearchQueryChange(queryText) {
    const { documentSearchQueryText } = this.state;
    if (queryText !== documentSearchQueryText) {
      
      this.setState({
        documentSearchQueryText: queryText
      });
    }
  }
  
  onSubmitDocumentSearch(queryText) {
    this.setState({
      documentSearchQueryText: queryText,
      searchResults: null,
      fetchedRecords: false,
      selectedRecords: false,
      numPages: 0
    });
    
    this.updateSearchResults();    
  }
  
  render() {
    const { document: doc, session, hash, queryText } = this.props;
    const { width, numPages, searchResults, documentSearchQueryText } = this.state;

    const pageNumber = (hash.page && parseInt(hash.page, 10) <= numPages) ? parseInt(hash.page, 10) : 1;

    if (!doc || !doc.links || !doc.links.pdf) {
      return null;
    }

    const displayPdf = (documentSearchQueryText === null) ? true : false;
    const displayPdfWithSearchResults = (documentSearchQueryText && numPages > 0) ? true : false;
    
    if (displayPdf === true) {
      let fileUrl = doc.links.pdf;
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
                      <li><span className="no-results pt-text-muted">No results.</span></li>
                    }
                    {searchResults !== null && searchResults.results.length > 0 && searchResults.results.map((result, index) => (
                      <li key={`page-${result.id}`}><a href={result.href} className={classNames({active: pageNumber === result.pageNumber})}>Page {result.pageNumber}</a></li>
                    ))}
                  </ul>
                }
              </div>
              {displayPdf === true &&
                <div id="PdfViewer" className="inner">
                  <div className="document">
                    <div ref={(ref) => this.pdfElement = ref}>
                        <Document
                          renderAnnotations={true}
                          file={fileUrl}
                          onLoadSuccess={this.onDocumentLoad}
                          loading={(<SectionLoading />)}>
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
                  <div className="heading">
                    <DocumentSearch
                      document={doc}
                      queryText={documentSearchQueryText}
                      onSearchQueryChange={this.onSearchQueryChange}
                      onSubmitSearch={this.onSubmitDocumentSearch}
                      />
                  </div>
                  {(searchResults === null || searchResults.isLoading === true) &&
                    <Spinner className="pt-small spinner" />
                  }
                  <ul>
                    {searchResults !== null && searchResults.isLoading === false && searchResults.results.length === 0 &&
                      <li><span className="no-results pt-text-muted">No results.</span></li>
                    }
                    {searchResults !== null && searchResults.results.length > 0 && searchResults.results.map((result, index) => (
                      <li key={`page-${result.id}`}>
                        <p>
                          <Link to={result.to} className={classNames({active: pageNumber === result.pageNumber})}>
                             <span className={`pt-icon-document`}/> Page {result.pageNumber}
                          </Link>
                        </p>
                        <p>
                          <Link to={result.to} className="pt-text-muted">
                              <span dangerouslySetInnerHTML={{__html: result.highlight.join('  …  ')}} />
                          </Link>
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
  const { document: doc, location: loc } = ownProps;

  const qs = queryString.parse(loc.search);
  const queryText = (qs.q && qs.q.length > 0) ? qs.q : null;
  const path = doc.links ? doc.links.records : null;
  const query = Query.fromLocation(path, loc, { 
      q: queryText,
      highlight: true,
      highlight_count: 10,
      highlight_length: 100
    }, 'document').limit(50);
  
  return {
    state: state,
    session: state.session,
    query: query,
    queryText: queryText,
    hash: queryString.parse(loc.hash)
  }
}

PdfViewer = connect(mapStateToProps, { queryDocumentRecords })(PdfViewer);

PdfViewer = withRouter(PdfViewer);

export default PdfViewer