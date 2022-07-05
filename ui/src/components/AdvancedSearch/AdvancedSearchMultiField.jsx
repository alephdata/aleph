import React, { PureComponent } from 'react';
import { Button, Collapse, Divider, FormGroup, Tag } from '@blueprintjs/core';

import AdvancedSearchMultiFieldForm from 'components/AdvancedSearch/AdvancedSearchMultiFieldForm';
import { Count } from 'components/common';

import './AdvancedSearchMultiField.scss';

class AdvancedSearchMultiField extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      showHelpText: false,
    };

    this.onRemove = this.onRemove.bind(this);
    this.onFormSubmit = this.onFormSubmit.bind(this);
  }

  onRemove(index) {
    const { onChange, values } = this.props;
    values.splice(index, 1);
    onChange(values);
  }

  onFormSubmit(newVal) {
    const { onChange, values } = this.props;
    onChange([...values, newVal]);
  }

  toggleHelpText = () => {
    this.setState(({ showHelpText }) => ({ showHelpText: !showHelpText }));
  };

  render() {
    const { field, helperText, label, values } = this.props;
    const { showHelpText } = this.state;

    return (
      <>
        <Divider />
        <FormGroup
          label={
            <div className="AdvancedSearchMultiField__label">
              <span>{label}</span>
              <Button
                small
                minimal
                icon={showHelpText ? 'chevron-up' : 'help'}
                className="AdvancedSearchMultiField__helptext__toggle"
                onClick={this.toggleHelpText}
              />
            </div>
          }
          className="AdvancedSearchMultiField"
        >
          <Collapse
            isOpen={showHelpText}
            className="AdvancedSearchMultiField__helptext"
          >
            <span className="bp3-form-helper-text">{helperText}</span>
          </Collapse>
          {values.length > 0 && (
            <div className="AdvancedSearchMultiField__list">
              {values?.map((v, i) => (
                <Tag
                  key={i}
                  onRemove={() => this.onRemove(i)}
                  rightIcon={<Count count={v.distance} />}
                  className="AdvancedSearchMultiField__list__item"
                  minimal
                >
                  <span>{v.term}</span>
                  {v.term2 && <span> - {v.term2}</span>}
                </Tag>
              ))}
            </div>
          )}
          <AdvancedSearchMultiFieldForm
            field={field}
            onSubmit={this.onFormSubmit}
          />
        </FormGroup>
      </>
    );
  }
}

export default AdvancedSearchMultiField;
