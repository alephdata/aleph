import React, { Component } from 'react';
import { connect } from 'react-redux';
import { PagingButtons } from '/src/components/Toolbar';
import { queryEntities } from '/src/actions/index.js';
import { selectEntitiesResult, selectEntity } from '/src/selectors.js';
import TextViewer from '/src/viewers/TextViewer.jsx';

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
    const { numPages, query, result } = this.props;
    if (numPages !== undefined && result.shouldLoad) {
      this.props.queryEntities({ query });
    }
  }

  render() {
    const { document, dir, entity, numPages, page } = this.props;

    return (
      <>
        <PagingButtons
          document={document}
          numberOfPages={numPages}
          page={page}
          showRotateButtons={false}
        />
        <TextViewer document={entity} dir={dir} noStyle />
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { query } = ownProps;

  const result = selectEntitiesResult(state, query);

  const entity = result.results.length
    ? result.results[0]
    : selectEntity(state, undefined);

  return {
    query,
    result,
    entity,
  };
};

export default connect(mapStateToProps, { queryEntities })(PdfViewerPage);
