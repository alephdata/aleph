import EntitySetSelector from 'components/EntitySet/EntitySetSelector';
import { DialogToggleButton } from 'components/Toolbar';
import React from 'react';
import { Count } from 'react-ftm';
import { defineMessages } from 'react-intl';

const messages = defineMessages({
  add_to: {
    id: 'entity.viewer.add_to',
    defaultMessage: 'Add to...',
  },
});

export class EntityAddToButton extends React.Component {
  render() {
    const { entities, collection, schema, onSuccess, intl } = this.props;
    return (
      <DialogToggleButton
      buttonProps={{
        text: intl.formatMessage(messages.add_to),
        icon: 'add-to-artifact',
        disabled: entities.length < 1,
        rightIcon: <Count count={entities.length || null} />,
      }}
      Dialog={EntitySetSelector}
      dialogProps={{
        collection,
        entities,
        onSuccess,
        showTimelines: schema.getTemporalStartProperties().length > 0,
      }}
    />
    );
  }
}
