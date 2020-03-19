import React, { Component } from 'react';
import { throttle } from 'lodash';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import Query from 'src/app/Query';
import { PagingButtons } from 'src/components/Toolbar';
import { SectionLoading, Skeleton } from 'src/components/common';
import { queryEntities } from 'src/actions';
import { selectEntitiesResult } from 'src/selectors';
import PdfViewerSearch from 'src/viewers/PdfViewerSearch';
import PdfViewerPage from 'src/viewers/PdfViewerPage';

import './PdfViewer.scss';


export class PdfViewer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      width: null,
      components: {
        Document: SectionLoading,
        Page: SectionLoading,
      },
    };
    this.onDocumentLoad = this.onDocumentLoad.bind(this);
    this.onResize = this.onResize.bind(this);
  }

  componentDidMount() {
    this.fetchPage();
    this.onResize();
    this.fetchComponents();
    window.addEventListener('resize', throttle(this.onResize, 500));
  }

  componentDidUpdate(prevProps) {
    const { countQuery } = this.props;
    if (this.state.width === null) {
      this.onResize();
    }
    if (this.props.activeMode !== prevProps.activeMode) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.onResize();
      }, 350);
    }
    if (!countQuery.sameAs(prevProps.countQuery)) {
      this.fetchPage();
    }
  }

  componentWillUnmount() {
    clearTimeout(this.resizeTimeout);
    window.removeEventListener('resize', throttle(this.onResize, 500));
  }

  onDocumentLoad() {
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

  fetchPage() {
    const { countQuery, countResult } = this.props;
    if (countResult.shouldLoad) {
      this.props.queryEntities({ query: countQuery });
    }
  }

  fetchComponents() {
    import(/* webpackChunkName:'pdf-lib' */'react-pdf/dist/entry.webpack')
      .then((components) => this.setState({ components }));
  }

  renderPdf() {
    const {
      document, page, rotate, numPages,
    } = this.props;
    const { width } = this.state;
    const { Document, Page } = this.state.components;
    const loading = <Skeleton.Text type="div" length={4000} />;
    return (
      <>
        {numPages !== null && numPages > 0 && (
          <PagingButtons
            page={page}
            rotate={rotate}
            document={document}
            numberOfPages={numPages}
          />
        )}
        <div>
          <Document
            renderAnnotations
            file={document.links.pdf || document.links.file}
            loading={loading}
            onLoadSuccess={this.onDocumentLoad}
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
              rotate={rotate}
              loading={loading}
            />
            )}
          </Document>
        </div>
      </>
    );
  }

  render() {
    const {
      document, activeMode, baseQuery, page, queryText, numPages,
    } = this.props;
    if (document.isPending || numPages === undefined || numPages === null) {
      return <SectionLoading />;
    }
    return (
      <div className="PdfViewer">
        <div className="outer">
          <div id="PdfViewer" className="inner">
            <div className="document">
              <PdfViewerSearch
                document={document}
                activeMode={activeMode}
                queryText={queryText}
                baseQuery={baseQuery}
              >
                {activeMode === 'text' && (
                  <PdfViewerPage
                    document={document}
                    page={page}
                    numPages={numPages}
                    baseQuery={baseQuery}
                  />
                )}
                {activeMode === 'view' && this.renderPdf()}
              </PdfViewerSearch>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { document, location } = ownProps;
  const hashQuery = queryString.parse(location.hash);
  const page = parseInt(hashQuery.page, 10) || 1;
  const rotate = parseInt(hashQuery.rotate, 10) || 0;

  const baseQuery = Query.fromLocation('entities', location, {}, 'document')
    .setFilter('properties.document', document.id)
    .setFilter('schema', 'Page');
  const countQuery = baseQuery
    .setString('q', undefined)
    .offset(0)
    .limit(0);
  const countResult = selectEntitiesResult(state, countQuery);
  return {
    page,
    rotate,
    numPages: countResult.total,
    baseQuery,
    countQuery,
    countResult,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryEntities }),
)(PdfViewer);
