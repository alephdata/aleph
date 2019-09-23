import React, { Component } from 'react';
import { defineMessages, injectIntl } from 'react-intl';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';

import EntitySearch from 'src/components/EntitySearch/EntitySearch';
import { ErrorSection } from 'src/components/common';
import { queryEntitySimilar } from 'src/queries';

const messages = defineMessages({
  empty: {
    id: 'entity.similar.empty',
    defaultMessage: 'There are no similar entities.',
  },
});


class EntitySimilarMode extends Component {
  render() {
    const { intl } = this.props;
    const emptyComponent = (
      <ErrorSection
        icon="snowflake"
        title={intl.formatMessage(messages.empty)}
      />
    );
    return (
      <EntitySearch
        query={this.props.query}
        emptyComponent={emptyComponent}
      />
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entity, location } = ownProps;
  return { query: queryEntitySimilar(location, entity.id) };
};

EntitySimilarMode = connect(mapStateToProps, {})(EntitySimilarMode);
EntitySimilarMode = withRouter(EntitySimilarMode);
EntitySimilarMode = injectIntl(EntitySimilarMode);
export default EntitySimilarMode;
