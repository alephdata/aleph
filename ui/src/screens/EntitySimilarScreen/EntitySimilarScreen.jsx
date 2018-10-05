import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, defineMessages } from 'react-intl';

import { selectEntity } from 'src/selectors';
import EntitySimilarMode from 'src/components/Entity/EntitySimilarMode';
import EntityScreenContext from 'src/components/Entity/EntityScreenContext';

const messages = defineMessages({
  screen_title: {
    id: 'entity.similar.title',
    defaultMessage: 'Similar',
  }
});


class EntitySimilarScreen extends Component {
  render() {
    const { intl, entityId, entity } = this.props;
    return (
      <EntityScreenContext entityId={entityId}
                           activeMode='similar'
                           screenTitle={intl.formatMessage(messages.screen_title)}>
        <EntitySimilarMode entity={entity} />
      </EntityScreenContext>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  const { entityId } = ownProps.match.params;
  return {
    entityId,
    entity: selectEntity(state, entityId)
  };
};

EntitySimilarScreen = injectIntl(EntitySimilarScreen);
EntitySimilarScreen = connect(mapStateToProps, {})(EntitySimilarScreen);
export default EntitySimilarScreen;