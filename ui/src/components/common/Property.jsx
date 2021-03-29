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

    this.state = { editing: props.defaultEditing };
  }

  toggleEditing = () => {
    this.setState(({ editing }) => ({ editing: !editing }));
  }

  renderLabel(options) {
    const { prop, entity } = this.props;

    return (
      <span className="PropertyName text-muted">
        <VLProperty.Name prop={entity.schema.getProperty(prop)} />
        {options?.withSeparator && <span>:</span>}
      </span>
    );
  }

  render() {
    const { className, locale, model, onEdit, prop, entity, fetchEntitySuggestions, showLabel } = this.props;
    const { editing } = this.state;

    const property = entity.schema.getProperty(prop);

    if (editing) {
      return (
        <div className={className}>
          {showLabel && this.renderLabel({ withSeparator: true })}
          <PropertyEditor
            locale={locale}
            entity={entity}
            property={property}
            onSubmit={(entityData) => { this.toggleEditing(); onEdit(entityData); }}
            fetchEntitySuggestions={fetchEntitySuggestions}
          />
        </div>
      );
    } else {
      const values = entity.getProperty(property);
      const isEmpty = values.length === 0;
      return (
        <div className={className} onClick={this.toggleEditing}>
          {(isEmpty || showLabel) && this.renderLabel({ withSeparator: !isEmpty })}
          {!isEmpty && <Property.Values prop={property} values={values} />}
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
