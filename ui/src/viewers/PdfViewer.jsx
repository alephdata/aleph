import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { throttle } from 'lodash';
import queryString from 'query-string';
import { compose } from 'redux';
import { connect } from 'react-redux';

import withRouter from 'app/withRouter';
import Query from 'app/Query';
import { PagingButtons } from 'components/Toolbar';
import { SectionLoading, Skeleton } from 'components/common';
import { queryEntities } from 'actions';
import { selectEntitiesResult } from 'selectors';
import normalizeDegreeValue from 'util/normalizeDegreeValue';
import EntityActionBar from 'components/Entity/EntityActionBar';
import PdfViewerSearch from 'viewers/PdfViewerSearch';
import PdfViewerPage from 'viewers/PdfViewerPage';

import './PdfViewer.scss';

const messages = defineMessages({
  placeholder: {
    id: 'entity.viewer.search_placeholder',
    defaultMessage: 'Search in {label}',
  },
});

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
    this.onPageLoad = this.onPageLoad.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onSearch = this.onSearch.bind(this);
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
    if (
      this.props.activeMode !== prevProps.activeMode ||
      this.props.pdfUrl !== prevProps.pdfUrl
    ) {
      clearTimeout(this.resizeTimeout);
      this.onResize();
      this.resizeTimeout = setTimeout(() => {
        this.onResize();
      }, 350);
    }
    if (prevProps.rotate !== this.props.rotate) {
      this.setRotation();
    }
    if (!countQuery.sameAs(prevProps.countQuery)) {
      this.onResize();
      this.fetchPage();
    }
  }

  componentWillUnmount() {
    clearTimeout(this.resizeTimeout);
    window.removeEventListener('resize', throttle(this.onResize, 500));
  }

  onDocumentLoad(pdf) {
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

  onPageLoad(page) {
    this.pageData = page;
    this.setRotation();
  }

  onSearch(queryText) {
    const { navigate, location } = this.props;
    const hash = queryString.parse(location.hash);

    navigate({
      pathname: location.pathname,
      hash: queryString.stringify({
        ...hash,
        page: undefined,
        q: queryText || undefined,
      }),
    });
  }

  setRotation() {
    const { rotate } = this.props;
    // For reference: https://github.com/wojtekmaj/react-pdf/issues/277#issuecomment-424464542
    if (this.pageData) {
      this.setState({
        effectiveRotation: normalizeDegreeValue(
          this.pageData.rotate + (rotate || 0)
        ),
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
    const PdfViewerElement = window.document.getElementById('PdfViewer');
    const width = PdfViewerElement
      ? parseInt(
          PdfViewerElement.getBoundingClientRect().width - scrollBarWidth,
          10
        )
      : null;

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
    import(/* webpackChunkName:'pdf-lib' */ 'react-pdf').then(
      ({ Document, Page, pdfjs }) => {
        // see https://github.com/wojtekmaj/react-pdf#create-react-app
        pdfjs.GlobalWorkerOptions.workerSrc = `/static/pdf.worker.min.js`;
        this.setState({ components: { Document, Page } });
      }
    );
  }

  renderPdf() {
    const { document, page, rotate, numPages, pdfUrl } = this.props;
    const { effectiveRotation, width } = this.state;
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
            showRotateButtons
          />
        )}
        <div key={pdfUrl}>
          <Document
            renderAnnotations
            file={pdfUrl}
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
                rotate={effectiveRotation}
                loading={loading}
                onLoadSuccess={this.onPageLoad}
              />
            )}
          </Document>
        </div>
      </>
    );
  }

  render() {
    const {
      document,
      dir,
      activeMode,
      pageQuery,
      searchQuery,
      intl,
      page,
      numPages,
      shouldRenderSearch,
    } = this.props;

    if (document.isPending || numPages === undefined || numPages === null) {
      return <SectionLoading />;
    }
    return (
      <div className="PdfViewer">
        <EntityActionBar
          query={shouldRenderSearch ? searchQuery : pageQuery}
          onSearchSubmit={this.onSearch}
          searchPlaceholder={intl.formatMessage(messages.placeholder, {
            label: document.getCaption(),
          })}
          searchDisabled={document.getProperty('processingError')?.length}
        />
        <div className="outer">
          <div id="PdfViewer" className="inner">
            <div className="document">
              {shouldRenderSearch && (
                <PdfViewerSearch
                  document={document}
                  dir={dir}
                  activeMode={activeMode}
                  query={searchQuery}
                />
              )}
              {activeMode === 'text' && !shouldRenderSearch && (
                <PdfViewerPage
                  document={document}
                  dir={dir}
                  page={page}
                  numPages={numPages}
                  query={pageQuery}
                />
              )}
              {activeMode === 'view' && !shouldRenderSearch && this.renderPdf()}
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
  const rotate = hashQuery.rotate && parseInt(hashQuery.rotate, 10);

  const baseQuery = Query.fromLocation('entities', location, {}, 'document')
    .setFilter('properties.document', document.id)
    .setFilter('schema', 'Page');

  const countQuery = baseQuery.setString('q', undefined).offset(0).limit(0);

  const queryText = hashQuery.q;

  const searchQuery = baseQuery
    .set('highlight', true)
    .set('q', queryText)
    .sortBy('properties.index', 'asc')
    .clear('limit')
    .clear('offset');

  const pageQuery = baseQuery
    .set('highlight', true)
    .set('highlight_text', queryText)
    .set('highlight_count', 15)
    .setFilter('properties.index', page)
    .set('limit', 1);

  const countResult = selectEntitiesResult(state, countQuery);
  const pdfUrl = document.links?.pdf || document.links?.file;
  const shouldRenderSearch = queryText && !hashQuery.page;

  return {
    page,
    pdfUrl,
    rotate,
    numPages: countResult.total,
    baseQuery,
    countQuery,
    searchQuery,
    pageQuery,
    queryText,
    countResult,
    hashQuery,
    shouldRenderSearch,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryEntities }),
  injectIntl
)(PdfViewer);
