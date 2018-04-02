import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import { Document, Page } from 'react-pdf/dist/entry.webpack';
import { throttle } from 'lodash';
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
      searchResults: props.searchResults || null
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
    
    this.fetchRecords();
  }

  componentWillReceiveProps(newProps) {
    this.setState({ 
      searchResults: newProps.searchResults || null
    });
    if (newProps.queryText !== this.props.queryText) {
      this.fetchRecords();
    }
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

  fetchRecords() {
    const { queryDocumentRecords, query } = this.props;
    if (query.path) {
      queryDocumentRecords({query})
    }
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
    const { document, session, queryText, hash } = this.props;
    const { width, searchResults, numPages } = this.state;

    const pageNumber = (hash.page && parseInt(hash.page, 10) <= numPages) ? parseInt(hash.page, 10) : 1;

    if (!document || !document.links || !document.links.pdf) {
      return null;
    }
    
    const displayDocumentSearchResults = (queryText) ? true : false;
    
    let url = document.links.pdf;
    if (session.token) {
      url = `${url}?api_key=${session.token}`;
    }
    
    return (
      <React.Fragment>
        <div className="PdfViewer">
          <div className={classNames("outer", { 'with-page-list': displayDocumentSearchResults })}>
            <div className="pages">
              <div className="heading">Found on page:</div>
              {displayDocumentSearchResults === true &&
                <ul>
                  {searchResults !== null && searchResults.isLoading === false && searchResults.results.length === 0 &&
                    <li className="pt-text-muted">No Results.</li>
                  }
                  {searchResults !== null && searchResults.results.length > 0 && searchResults.results.map((result, index) => (
                    <li><a href={result.href}>Page {result.pageNumber}</a></li>
                  ))}
                </ul>
              }
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
  const { document: doc, location: loc } = ownProps;

  const hash = queryString.parse(loc.hash);
  
  const qs = queryString.parse(loc.search);
  const path = doc.links ? doc.links.records : null;
  const query = Query.fromLocation(path, loc, { q: qs.q || null}, 'document').limit(50);
  const results = (qs.q) ? selectDocumentRecordsResult(state, query) : null;

  const searchResults = {
    isLoading: (results) ? results.isLoading : false,
    results: []
  };
  if (results !== null) {
    results.results.map((result) => {
      hash.page = result.index
      searchResults.results.push({
        pageNumber: result.index,
        href: `#${queryString.stringify(hash)}`
      })
      return true;
    });
  }
  
  return {
    session: state.session,
    query: query,
    queryText: qs.q || null,
    hash: queryString.parse(loc.hash),
    searchResults: searchResults
  }
}

PdfViewer = connect(mapStateToProps, { queryDocumentRecords })(PdfViewer);

PdfViewer = withRouter(PdfViewer);

export default PdfViewer