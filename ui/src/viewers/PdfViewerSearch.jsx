import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';
import { compose } from 'redux';
import { connect } from 'react-redux';
import queryString from 'query-string';
import {
  SectionLoading,
  SearchHighlight,
  QueryInfiniteLoad,
  ResultText,
} from 'components/common';
import { Classes } from '@blueprintjs/core';
import c from 'classnames';
import Query from 'app/Query';
import { queryEntities } from 'actions';
import { selectEntitiesResult } from 'selectors';
import withRouter from 'app/withRouter';

import './PdfViewerSearch.scss';

class PdfViewerSearch extends Component {
  constructor(props) {
    super(props);
    this.getResultLink = this.getResultLink.bind(this);
  }

  componentDidMount() {
    this.fetchSearchResults();
  }

  componentDidUpdate(prevProps) {
    const { query } = this.props;
    if (!query.sameAs(prevProps.query)) {
      this.fetchSearchResults();
    }
  }

  getResultLink(result) {
    const { activeMode, query, document, location, isPreview } = this.props;
    const parsedHash = queryString.parse(location.hash);

    if (isPreview) {
      parsedHash['preview:mode'] = 'view';
    } else {
      parsedHash['mode'] = 'view';
    }

    parsedHash['page'] = result.getProperty('index').toString();
    parsedHash['q'] = query.getString('q');

    return `#${queryString.stringify(parsedHash)}`;
  }

  fetchSearchResults() {
    const { query, result } = this.props;
    if (!!query.getString('q') && result.shouldLoad) {
      this.props.queryEntities({ query });
    }
  }

  render() {
    const { result, query } = this.props;

    if (!query.getString('q')) {
      return this.renderEmptyState();
    }

    if (result.total === undefined) {
      return <SectionLoading />;
    }

    return (
      <div className="PdfViewerSearch">
        {result.total === 0 ? this.renderEmptyState() : this.renderResults()}
      </div>
    );
  }

  renderResults() {
    const { dir, result, query } = this.props;

    return (
      <>
        <div className="PdfViewerSearch__total">
          <ResultText result={result} />
        </div>
        <ul className="PdfViewerSearch__results">
          {result.results.map((res) => (
            <li key={`page-${res.id}`} className="PdfViewerSearch__result">
              <p dir={dir}>
                <a href={this.getResultLink(res)}>
                  <span
                    className={c(
                      Classes.ICON,
                      `${Classes.ICON}-document`,
                      'PdfViewerSearch__icon'
                    )}
                  />
                  <FormattedMessage
                    id="document.pdf.search.page"
                    defaultMessage="Page {page}"
                    values={{
                      page: res.getProperty('index'),
                    }}
                  />
                </a>
              </p>
              <SearchHighlight highlight={res.highlight} />
            </li>
          ))}
        </ul>
        <QueryInfiniteLoad
          query={query}
          result={result}
          fetch={queryEntities}
        />
      </>
    );
  }

  renderEmptyState() {
    return (
      <div
        className={c(
          Classes.CALLOUT,
          Classes.INTENT_WARNING,
          `${Classes.ICON}-search`
        )}
      >
        <FormattedMessage
          id="document.search.no_match"
          defaultMessage="No single page within this document matches all your search terms."
        />
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { isPreview, document, location } = ownProps;

  const parsedHash = queryString.parse(location.hash);
  const q = isPreview ? parsedHash['preview:q'] : parsedHash['q'];

  const query = new Query('entities', {}, {}, 'search')
    .setFilter('properties.document', document.id)
    .setFilter('schema', 'Page')
    .set('highlight', true)
    .set('q', q)
    .sortBy('properties.index', 'asc');

  return {
    query,
    result: selectEntitiesResult(state, query),
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, { queryEntities })
)(PdfViewerSearch);
