import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';
import { connect } from 'react-redux';
import queryString from 'query-string';
import { SectionLoading, SearchHighlight } from 'components/common';
import { queryEntities } from 'actions';
import { selectEntitiesResult } from 'selectors';

class PdfViewerSearch extends Component {
  constructor(props) {
    super(props);
    this.getResultLink = this.getResultLink.bind(this);
  }

  componentDidMount() {
    this.fetchPage();
  }

  componentDidUpdate(prevProps) {
    const { query } = this.props;
    if (!query.sameAs(prevProps.query)) {
      this.fetchPage();
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

  fetchPage() {
    const { query, result } = this.props;
    if (!!query.getString('q') && result.shouldLoad) {
      this.props.queryEntities({ query });
    }
  }

  render() {
    const { page, dir, result } = this.props;

    if (result.total === undefined) {
      return <SectionLoading />;
    }

    return (
      <div className="pages">
        {result.total === 0 && (
          <>
            <div className="bp3-callout bp3-intent-warning bp3-icon-search">
              <FormattedMessage
                id="document.search.no_match"
                defaultMessage="No single page within this document matches all your search terms."
              />
            </div>
            {this.props.children}
          </>
        )}
        <ul>
          {result.results.map((res) => (
            <li key={`page-${res.id}`}>
              <p dir={dir}>
                <Link
                  to={this.getResultLink(res)}
                  className={classNames({ active: page === res.index })}
                >
                  <span className="bp3-icon bp3-icon-document" />
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
