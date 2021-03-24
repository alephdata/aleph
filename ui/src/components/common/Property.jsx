import React from 'react';
import { connect } from 'react-redux';
import { Entity as FTMEntity } from '@alephdata/followthemoney';
import { Property as VLProperty, PropertyEditor } from '@alephdata/react-ftm';

import { Entity } from 'components/common';
import { selectLocale, selectModel } from 'selectors';

import './Property.scss';

const getEntityLink = entity => <Entity.Link entity={entity} icon />;


class EditableProperty extends React.Component {
  constructor(props) {
    super(props);

    this.state = { editing: false };
  }

  toggleEditing = () => {
    this.setState(({ editing }) => ({ editing: !editing }));
  }

  render() {
    const { locale, model, onEdit, property, entity, fetchEntitySuggestions } = this.props;
    const { editing } = this.state;

    const ftmProp = entity.schema.getProperty(property);

    if (editing) {
      return (
        <PropertyEditor
          locale={locale}
          entity={entity}
          property={ftmProp}
          onSubmit={(entityData) => { this.toggleEditing(); onEdit(entityData); }}
          fetchEntitySuggestions={fetchEntitySuggestions}
        />
      );
    } else {
      const values = entity.getProperty(property);
      const isEmpty = values.length === 0;
      return (
        <div onClick={this.toggleEditing}>
          {isEmpty && <span className="bp3-text-muted">{ftmProp.label}</span>}
          {!isEmpty && <Property.Values prop={ftmProp} values={values} />}
        </div>
      );
    }
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
