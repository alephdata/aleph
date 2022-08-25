import React from 'react';
import {
  defineMessages,
  FormattedMessage,
  injectIntl,
  WrappedComponentProps,
} from 'react-intl';
import { Button, Classes } from '@blueprintjs/core';
import {
  Values,
  Value,
  Property as FTMProperty,
  Entity as FTMEntity,
} from '@alephdata/followthemoney';
import truncateText from 'truncate';
import c from 'classnames';

import {
  Country,
  Date,
  Entity,
  FileSize,
  Language,
  Transliterate,
  Numeric,
  Topic,
  URL,
} from '.';
import { ensureArray, wordList } from 'react-ftm/utils';

import './Property.scss';

interface IPropertyCommonProps {
  prop: FTMProperty;
}

class PropertyName extends React.PureComponent<IPropertyCommonProps> {
  render() {
    const { prop } = this.props;
    return prop.label;
  }
}

// ----------

interface IPropertyReverseProps
  extends IPropertyCommonProps,
    WrappedComponentProps {}

class PropertyReverse extends React.PureComponent<IPropertyReverseProps> {
  render() {
    const { prop } = this.props;
    if (!prop.hasReverse) {
      return (
        <FormattedMessage
          id="property.inverse"
          defaultMessage="'{label}' of …"
          values={{
            label: <PropertyName prop={prop} />,
          }}
        />
      );
    }
    const reverseProp = prop.getReverse();
    return reverseProp.label;
  }
}

// ----------

interface IPropertyValueProps extends IPropertyCommonProps {
  value: Value;
  resolveEntityReference?: (entityId: string) => FTMEntity | undefined;
  getEntityLink?: (entity: FTMEntity) => any;
  translitLookup?: any;
  truncate?: number;
}

const getSortValue = ({
  prop,
  resolveEntityReference,
  value,
}: IPropertyValueProps) => {
  if (prop.type.name === 'entity') {
    const entity =
      'string' === typeof value && resolveEntityReference
        ? resolveEntityReference(value)
        : (value as FTMEntity);
    return entity ? entity.getCaption().toLowerCase() : value;
  } else if (prop.type.name === 'number' || prop.type.name === 'fileSize') {
    return +value;
  } else if (
    prop.type.name === 'country' ||
    prop.type.name === 'topic' ||
    prop.type.name === 'language'
  ) {
    const resolved = prop.type.values.get(value as string);
    return resolved ? resolved.toLowerCase() : value;
  }
  return (value as string).toLowerCase();
};

class PropertyValue extends React.PureComponent<IPropertyValueProps> {
  render() {
    const {
      getEntityLink,
      prop,
      resolveEntityReference,
      value,
      truncate,
      translitLookup,
    } = this.props;
    if (!value) {
      return null;
    }
    if (prop.type.name === 'entity') {
      const entity =
        'string' === typeof value && resolveEntityReference
          ? resolveEntityReference(value)
          : value;
      if (getEntityLink) {
        return getEntityLink(entity as FTMEntity);
      }
      return <Entity.Label entity={entity as FTMEntity} icon />;
    } else if (typeof value !== 'string') {
      return value;
    }

    if (prop.name === 'fileSize') {
      return <FileSize value={+value} />;
    }
    if (prop.type.name === 'country') {
      return (
        <Country.Label code={value as string} fullList={prop.type.values} />
      );
    }
    if (prop.type.name === 'topic') {
      return <Topic.Label code={value as string} fullList={prop.type.values} />;
    }
    if (prop.type.name === 'language') {
      return (
        <Language.Label code={value as string} fullList={prop.type.values} />
      );
    }
    if (prop.type.name === 'url') {
      return (
        <URL
          value={value as string}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          truncate={truncate}
        />
      );
    }
    if (prop.type.name === 'date') {
      return <Date value={value as string} />;
    }
    if (prop.type.name === 'number' && !isNaN(+value)) {
      return <Numeric num={+value} />;
    }
    if (prop.type.name === 'name' || prop.type.name === 'address') {
      return (
        <Transliterate
          value={value}
          lookup={translitLookup}
          truncate={truncate}
        />
      );
    }
    return truncate ? truncateText(value, truncate) : value;
  }
}

// ----------

interface IPropertyValuesProps
  extends IPropertyCommonProps,
    WrappedComponentProps {
  values: Values;
  separator?: string;
  missing?: string;
  resolveEntityReference?: (entityId: string) => FTMEntity | undefined;
  getEntityLink?: (entity: FTMEntity) => any;
  translitLookup?: any;
  truncate?: number;
  truncateItem?: number;
}

interface IPropertyValuesState {
  truncateShowAll: boolean;
}

const messages = defineMessages({
  truncate_show: {
    id: 'property.values.truncate_show',
    defaultMessage: '+{truncateCount} More',
  },
  truncate_hide: {
    id: 'property.values.truncate_hide',
    defaultMessage: '- Show fewer',
  },
});

class PropertyValues extends React.PureComponent<
  IPropertyValuesProps,
  IPropertyValuesState
> {
  constructor(props: IPropertyValuesProps) {
    super(props);
    this.state = { truncateShowAll: false };
  }

  toggleTruncateShowAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    this.setState(({ truncateShowAll }) => ({
      truncateShowAll: !truncateShowAll,
    }));
  };

  render() {
    const {
      getEntityLink,
      intl,
      prop,
      resolveEntityReference,
      values,
      truncate,
      truncateItem,
      separator = ' · ',
      missing = '—',
      translitLookup,
    } = this.props;
    const { truncateShowAll } = this.state;

    const vals = ensureArray(
      truncate && !truncateShowAll ? values.slice(0, truncate) : values
    ).map((value) => (
      <PropertyValue
        key={typeof value === 'string' ? value : value.id}
        prop={prop}
        value={value}
        resolveEntityReference={resolveEntityReference}
        getEntityLink={getEntityLink}
        translitLookup={translitLookup}
        truncate={truncateItem}
      />
    ));
    let content;
    if (!vals.length) {
      content = <span className="no-value">{missing}</span>;
      // display urls separated by newline
    } else if (prop.type.name === 'url' || !!getEntityLink) {
      content = vals.map((val, i) => (
        <span key={i} style={{ display: 'block' }}>
          {val}
        </span>
      ));
    } else {
      content = wordList(vals, separator);
    }

    const truncateText = !!truncate && values.length > truncate && (
      <Button
        minimal
        small
        className={c('more-text', Classes.TEXT_MUTED)}
        onClick={this.toggleTruncateShowAll}
        text={intl.formatMessage(
          messages[truncateShowAll ? 'truncate_hide' : 'truncate_show'],
          {
            truncateCount: values.length - truncate,
          }
        )}
      />
    );

    return (
      <span className="PropertyValues">
        {content}
        {truncateText}
      </span>
    );
  }
}

class Property extends React.Component {
  static Name = PropertyName;

  static Reverse = injectIntl(PropertyReverse);

  static getSortValue = getSortValue;

  static Value = PropertyValue;

  static Values = injectIntl(PropertyValues);
}

export default Property;
