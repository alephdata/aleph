import React, { Component } from 'react';
import { connect } from 'react-redux';
import { SectionLoading } from 'components/common';
import { PagingButtons } from 'components/Toolbar';
import { queryEntities } from 'actions';
import { selectEntitiesResult } from 'selectors';
import TextViewer from 'viewers/TextViewer';


class PdfViewerPage extends Component {
  componentDidMount() {
    this.fetchPage();
  }

  componentDidUpdate(prevProps) {
    const { query } = this.props;
    if (!query.sameAs(prevProps.query)) {
      this.fetchPage();
    }
  }

  fetchPage() {
    const { query, result } = this.props;
    if (result.shouldLoad) {
      this.props.queryEntities({ query });
    }
  }

  render() {
    const { document, entity, numPages, page } = this.props;
    if (document.isPending || numPages === undefined) {
      return <SectionLoading />;
    }
    return (
      <>
        <PagingButtons document={document} numberOfPages={numPages} page={page} />
        {entity && (
          <TextViewer document={entity} noStyle />
        )}
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { baseQuery, page } = ownProps;
  const query = baseQuery
    .setString('q', undefined)
    .setFilter('properties.index', page);
  const result = selectEntitiesResult(state, query);
  const entity = result.results.length ? result.results[0] : null;
  return {
    query,
    result,
    entity,
  };
};

export default connect(mapStateToProps, { queryEntities })(PdfViewerPage);
