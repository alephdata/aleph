import * as React from 'react';
import { defineMessages, injectIntl, WrappedComponentProps } from 'react-intl';
import { Value } from '@alephdata/followthemoney';
import { ControlGroup, MenuItem, Position } from '@blueprintjs/core';
import { MultiSelect } from '@blueprintjs/select';
import { ITypeEditorProps } from './common';
import { highlightText } from 'react-ftm/utils';

const messages = defineMessages({
  no_results: {
    id: 'enum_value_select.no_results',
    defaultMessage: 'No results found',
  },
});

const TypedMultiSelect = MultiSelect.ofType<string>();

interface IEnumValueSelectProps
  extends ITypeEditorProps,
    WrappedComponentProps {
  fullList: Map<string, string>;
}

class EnumValueSelect extends React.Component<IEnumValueSelectProps> {
  private inputRef: HTMLInputElement | null = null;

  constructor(props: any) {
    super(props);
    this.onChange = this.onChange.bind(this);
    this.onRemove = this.onRemove.bind(this);
  }

  componentDidMount() {
    this.inputRef && this.inputRef.focus();
  }

  onChange(item: string, event: any) {
    event.preventDefault();
    event.stopPropagation();
    const { values } = this.props;
    if (item) {
      this.props.onSubmit([...values, item as Value]);
    } else {
      this.props.onSubmit(values);
    }
  }

  onRemove(item: string) {
    const { values } = this.props;
    this.props.onSubmit(values.filter((v) => v !== item));
  }

  render() {
    const {
      inputProps = {},
      popoverProps = {},
      intl,
      fullList,
      values,
    } = this.props;
    const optionsMap = new Map(fullList);
    const options = Array.from(optionsMap.keys());
    const getLabel = (key: string) => optionsMap.get(key) || '';

    return (
      <ControlGroup vertical fill>
        <TypedMultiSelect
          tagRenderer={getLabel}
          onItemSelect={this.onChange}
          onRemove={this.onRemove}
          itemRenderer={(key, { handleClick, modifiers, query }) => (
            <MenuItem
              active={modifiers.active}
              disabled={modifiers.disabled}
              key={key}
              onClick={handleClick}
              text={highlightText(getLabel(key), query)}
            />
          )}
          items={options}
          popoverProps={{
            minimal: true,
            position: Position.BOTTOM_LEFT,
            ...popoverProps,
          }}
          tagInputProps={{
            inputRef: (ref) => (this.inputRef = ref),
            tagProps: { interactive: false, minimal: true },
            placeholder: '',
            ...inputProps,
          }}
          itemPredicate={(query, item) => {
            const queryProcessed = query.toLowerCase();
            return getLabel(item).toLowerCase().includes(queryProcessed); // eslint-disable-line @typescript-eslint/no-unused-vars
          }}
          selectedItems={values as [string]}
          noResults={
            <MenuItem disabled text={intl.formatMessage(messages.no_results)} />
          }
          openOnKeyDown
          resetOnSelect
          fill
        />
      </ControlGroup>
    );
  }
}

export default injectIntl(EnumValueSelect);
