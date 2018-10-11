import React, { Component } from 'react';
import { connect } from 'react-redux';
import { injectIntl, defineMessages } from 'react-intl';

import EntityTagsMode from 'src/components/Entity/EntityTagsMode';
import EntityScreenContext from 'src/components/Entity/EntityScreenContext';
import { selectEntity } from 'src/selectors';

const messages = defineMessages({
  screen_title: {
    id: 'entity.tags.title',
    defaultMessage: 'Connections',
  }
});


class EntityTagsScreen extends Component {
  render() {
    const { intl, entityId, entity } = this.props;
    return (
      <EntityScreenContext entityId={entityId} 
                           activeMode='tags'
                           screenTitle={intl.formatMessage(messages.screen_title)}>
        <EntityTagsMode entity={entity} />
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

EntityTagsScreen = injectIntl(EntityTagsScreen);
EntityTagsScreen = connect(mapStateToProps, {})(EntityTagsScreen);
export default EntityTagsScreen;