import React from 'react';
import { connect } from 'react-redux';
import { EditableProperty as VLEditableProperty, Property as VLProperty, PropertyEditor } from '@alephdata/react-ftm';
import { Button } from '@blueprintjs/core';

import { Entity } from 'components/common';
import { selectLocale, selectModel } from 'selectors';

import './Property.scss';

const getEntityLink = entity => <Entity.Link entity={entity} icon />;


class EditableProperty extends React.Component {
  constructor(props) {
    super(props);

    this.state = { editing: props.defaultEditing };
  }

  toggleEditing = () => {
    console.log('toggling')
    this.setState(({ editing }) => ({ editing: !editing }));
  }

  render() {
    const { className, locale, onEdit, prop, entity, fetchEntitySuggestions, showLabel, minimal, toggleButtonProps } = this.props;
    const { editing } = this.state;

    const property = entity.schema.getProperty(prop);

    console.log(entity.hasProperty(property));

    if (toggleButtonProps && !editing && !entity.hasProperty(property)) {
      return (
        <Button {...toggleButtonProps} onClick={this.toggleEditing} />
      );
    }

    return (
      <VLEditableProperty
        entity={entity}
        property={property}
        editing={editing}
        onToggleEdit={this.toggleEditing}
        onSubmit={(entity) => { this.toggleEditing(); onEdit(entity) }}
        fetchEntitySuggestions={fetchEntitySuggestions}
        minimal={minimal}
      />
    )
  }
}

const mapStateToProps = state => ({
  locale: selectLocale(state),
  model: selectModel(state),
});

class Property {
  static Name = VLProperty.Name;

  static Reverse = connect(mapStateToProps)(VLProperty.Reverse);

  static Value = (props) => <VLProperty.Value {...props} getEntityLink={getEntityLink} />

  static Values = (props) => <VLProperty.Values {...props} getEntityLink={getEntityLink} />

  static Editable = connect(mapStateToProps)(EditableProperty);
}

export default Property;
