// SPDX-FileCopyrightText: 2022 2014-2015 Friedrich Lindenberg, <friedrich@pudo.org>, et al.
// SPDX-FileCopyrightText: 2022 2016-2020 Journalism Development Network,Inc
//
// SPDX-License-Identifier: MIT

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { PagingButtons } from 'components/Toolbar';
import { queryEntities } from 'actions';
import { selectEntitiesResult, selectEntity } from 'selectors';
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
    const { numPages, query, result } = this.props;
    if (numPages !== undefined && result.shouldLoad) {
      this.props.queryEntities({ query });
    }
  }

  render() {
    const { document, dir, entity, numPages, page } = this.props;

    return (
      <>
        <PagingButtons document={document} numberOfPages={numPages} page={page} showRotateButtons={false} />
        <TextViewer document={entity} dir={dir} noStyle />
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
