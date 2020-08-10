import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';
import { connect } from 'react-redux';
import getEntityLink from 'util/getEntityLink';
import { SectionLoading } from 'components/common';
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
    const { document, activeMode } = this.props;
    const path = getEntityLink(document);
    const page = result.getProperty('index').toString();
    return `${path}#page=${page}&mode=${activeMode}`;
  }

  fetchPage() {
    const { query, result } = this.props;
    if (!!query.getString('q') && result.shouldLoad) {
      this.props.queryEntities({ query });
    }
  }

  render() {
    const { page, query, result } = this.props;
    if (!query.getString('q')) {
      return this.props.children;
    }
    if (result.isPending) {
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
          {result.results.map(res => (
            <li key={`page-${res.id}`}>
              <p>
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
}

const mapStateToProps = (state, ownProps) => {
  const { baseQuery, queryText: queryOverride } = ownProps;
  const queryText = queryOverride || baseQuery.getString('q');
  const query = baseQuery.setString('q', queryText)
    .set('highlight', true)
    .set('highlight_count', 10)
    .set('highlight_length', 120)
    .sortBy('properties.index', 'asc')
    .clear('limit')
    .clear('offset');

  return {
    query,
    queryText,
    result: selectEntitiesResult(state, query),
  };
};

export default connect(mapStateToProps, { queryEntities })(PdfViewerSearch);
