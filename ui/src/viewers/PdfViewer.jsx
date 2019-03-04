import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { throttle } from 'lodash';
import queryString from 'query-string';
import classNames from 'classnames';

import Query from 'src/app/Query';
import getPath from 'src/util/getPath';
import { PagingButtons } from 'src/components/Toolbar';
import { SectionLoading } from 'src/components/common';
import { queryEntities } from 'src/actions';
import { selectEntitiesResult } from 'src/selectors';
import { connectedWithRouter } from 'src/util/enhancers';
import TextViewer from 'src/viewers/TextViewer';

import './PdfViewer.scss';


const mapStateToProps = (state, ownProps) => {
  const { document, location, queryText } = ownProps;
  const hashQuery = queryString.parse(location.hash);
  const page = parseInt(hashQuery.page, 10) || 1;
  let query = Query.fromLocation('entities', location, {}, 'document')
    .setFilter('properties.document', document.id)
    .setFilter('schemata', 'Page')
    .sortBy('properties.index', 'asc');
  if (queryText.length > 0) {
    query = query.setString('q', queryText)
      .set('highlight', true)
      .set('highlight_count', 10)
      .set('highlight_length', 120)
      .clearFilter('properties.index')
      .clear('limit')
      .clear('offset');
  }

  return {
    result: selectEntitiesResult(state, query),
    isSearch: !!query.getString('q'),
    page,
    query,
  };
};


export class PdfViewer extends Component {
  static TextMode(props) {
    const { document, result, page } = props;
    return result.total > 0 && (
    <React.Fragment>
      <PagingButtons document={document} numberOfPages={result.total} />
      <TextViewer document={result.results[page - 1]} noStyle />
    </React.Fragment>
    );
  }

  static SearchMode(props) {
    const { result, getResultLink, page } = props;
    return (

      <div className="pages">
        {result.total === 0 && (
          <div className="bp3-callout bp3-intent-warning bp3-icon-search">
            <FormattedMessage
              id="document.search.no_match"
              defaultMessage="No page within this document matches your search."
            />
          </div>
        )}
        <ul>
          {result.results.map(res => (
            <li key={`page-${res.id}`}>
              <p>
                <Link
                  to={getResultLink(res)}
                  className={classNames({ active: page === res.index })}
                >
                  <span className="bp3-icon-document" />
                  {' '}
                  {' '}
Page
                  {res.getProperty('index').toString()}
                </Link>
              </p>
              <p>
                {res.highlight !== undefined && (
                  <span dangerouslySetInnerHTML={{ __html: res.highlight.join('  …  ') }} />
                )}
              </p>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  static PDFMode(props) {
    const {
      document, page,
      onDocumentLoad,
      width, numPages, components: {
        Document,
        Page,
      },
    } = props;

    return (
      <React.Fragment>
        {numPages !== null && numPages > 0 && (
        <PagingButtons document={document} numberOfPages={numPages} />
        )}
        <div>
          <Document
            renderAnnotations
            file={document.links.pdf}
            loading={<SectionLoading />}
            onLoadSuccess={onDocumentLoad}
          >
            {/*
                  Only render Page when width has been set and numPages has been figured out.
                  This limits flashing / visible resizing when displaying page for the first time.
              */}
            {width !== null && numPages > 0 && (
            <Page
              pageNumber={page}
              className="page"
              width={width}
            />
            )}
          </Document>
        </div>
      </React.Fragment>
    );
  }

  constructor(props) {
    super(props);
    this.state = {
      width: null,
      numPages: 0,
      components: {
        Document: SectionLoading,
        Page: SectionLoading,
      },
    };
    this.onDocumentLoad = this.onDocumentLoad.bind(this);
    this.onResize = this.onResize.bind(this);
    this.getResultLink = this.getResultLink.bind(this);
  }

  componentDidMount() {
    this.fetchPage();
    this.onResize();
    this.fetchComponents();
    window.addEventListener('resize', throttle(this.onResize, 500));
  }

  componentDidUpdate(prevProps) {
    const { document, page, query } = this.props;
    if (this.state.width === null) {
      this.onResize();
    }
    if (this.props.activeMode !== prevProps.activeMode) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.onResize();
      }, 350);
    }
    if (!query.sameAs(prevProps.query)) {
      this.fetchPage();
    }
    if (document.id !== prevProps.document.id || page !== prevProps.page) {
      this.fetchPage();
    }
  }

  componentWillUnmount() {
    clearTimeout(this.resizeTimeout);
    window.removeEventListener('resize', throttle(this.onResize, 500));
  }

  onDocumentLoad(pdfInfo) {
    this.setState({ numPages: pdfInfo.numPages });
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

  onResize() {
    // Node we use a magic number to subtract scrollBarWidth (usually 15-17px)
    // to avoid loops whereby it draws with and without a scrollbar (and keeps
    // resizing indefinitely) when displayed at specific sizes in preview mode.
    // We should refactor this out for a better solution wherby on the document
    // itself scrolls in the preview (and possibly in the normal view too).
    const scrollBarWidth = 20;
    const PdfViewerElement = window.document.getElementById('PdfViewer');
    const width = PdfViewerElement ? parseInt(
      PdfViewerElement.getBoundingClientRect().width - scrollBarWidth, 10,
    ) : null;

    if (width !== null && width !== this.state.width) {
      this.setState({
        width: width - scrollBarWidth,
      });
    }
  }

  getResultLink(result) {
    const { document, activeMode } = this.props;
    const path = getPath(document.links.ui);
    return `${path}#page=${result.getProperty('index').toString()}&mode=${activeMode}`;
  }

  fetchPage() {
    const { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.queryEntities({ query });
    }
  }

  fetchComponents() {
    import(/* webpackChunkName:'pdf-lib' */'react-pdf/dist/entry.webpack')
      .then(components => this.setState({ components }));
  }


  render() {
    const {
      document, activeMode, page, result, isSearch,
    } = this.props;
    const { numPages } = this.state;
    const isLoading = (result.isLoading || result.shouldLoad)
      || (isSearch && result.total === undefined);
    if (document.id === undefined) {
      return null;
    }

    if (isLoading) {
      return <SectionLoading />;
    }
    return (
      <div className="PdfViewer">
        <div className="outer">
          <div id="PdfViewer" className="inner">
            <div className="document">
              {isSearch ? (
                <PdfViewer.SearchMode
                  result={result}
                  page={page}
                  getResultLink={this.getResultLink}
                />
              )
                : ((activeMode === 'text' && (
                <PdfViewer.TextMode
                  result={result}
                  document={document}
                  page={page}
                />
                ))
                  || (activeMode === 'view' && (
                    <PdfViewer.PDFMode
                      document={document}
                      page={page}
                      onDocumentLoad={this.onDocumentLoad}
                      width={this.state.width}
                      numPages={numPages}
                      components={this.state.components}
                    />
                  ))
                )
              }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connectedWithRouter({
  mapStateToProps,
  mapDispatchToProps: { queryEntities },
})(PdfViewer);
