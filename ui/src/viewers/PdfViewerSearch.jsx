import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';
import { connect } from 'react-redux';
import queryString from 'query-string';
import {
  SectionLoading,
  SearchHighlight,
  QueryInfiniteLoad,
} from 'components/common';
import { Classes } from '@blueprintjs/core';
import c from 'classnames';
import { queryEntities } from 'actions';
import { selectEntitiesResult } from 'selectors';

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
    const { activeMode, query } = this.props;
    const page = result.getProperty('index').toString();

    const hashQuery = {
      page,
      mode: activeMode,
      q: query.getString('q'),
    };

    return `#${queryString.stringify(hashQuery)}`;
  }

  fetchSearchResults() {
    const { query, result } = this.props;
    if (!!query.getString('q') && result.shouldLoad) {
      this.props.queryEntities({ query });
    }
  }

  render() {
    const { result } = this.props;

    if (result.total === undefined) {
      return <SectionLoading />;
    }

    return (
      <div className="pages">
        {result.total === 0 ? this.renderEmptyState() : this.renderResults()}
      </div>
    );
  }

  renderResults() {
    const { dir, result, query } = this.props;

    return (
      <>
        <ul>
          {result.results.map((res) => (
            <li key={`page-${res.id}`}>
              <p dir={dir}>
                <Link to={this.getResultLink(res)}>
                  <span
                    className={c(Classes.ICON, `${Classes.ICON}-document`)}
                  />
                  <FormattedMessage
                    id="document.pdf.search.page"
                    defaultMessage="Page {page}"
                    values={{
                      page: res.getProperty('index'),
                    }}
                  />
                </Link>
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
  const { query } = ownProps;

  return {
    result: selectEntitiesResult(state, query),
  };
};

export default connect(mapStateToProps, { queryEntities })(PdfViewerSearch);
