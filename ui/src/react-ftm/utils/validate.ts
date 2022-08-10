import { defineMessages } from 'react-intl';
import { Entity, Schema, Property, Values } from '@alephdata/followthemoney';
import { PhoneNumberUtil } from 'google-libphonenumber';

export const validationMessages = defineMessages({
  invalidDate: {
    id: 'editor.validation.date_invalid',
    defaultMessage: 'Date format: yyyy-m-d',
  },
  invalidUrl: {
    id: 'editor.validation.url_invalid',
    defaultMessage: 'Invalid URL format',
  },
  invalidCountry: {
    id: 'editor.validation.country_invalid',
    defaultMessage: 'Invalid country',
  },
  invalidTopic: {
    id: 'editor.validation.topic_invalid',
    defaultMessage: 'Invalid topic',
  },
  invalidPhone: {
    id: 'editor.validation.phone_invalid',
    defaultMessage:
      'Invalid phone number: try adding a country code if available',
  },
  required: {
    id: 'editor.validation.required',
    defaultMessage: 'This property is required',
  },
});

function isValidUrl(value: string) {
  try {
    new URL(value);
  } catch (e) {
    return false;
  }

  return true;
}

function isValidEnumValue(property: Property, value: string) {
  return property.type.values.has(value);
}

function isValidPhone(entity: Entity, value: string) {
  const phoneUtil = PhoneNumberUtil.getInstance();

  try {
    phoneUtil.parse(value);
    return true;
  } catch {
    // invalid international number
  }

  const countries = entity.getTypeValues('country') as Array<string>;
  for (const country of countries) {
    try {
      const parsed = phoneUtil.parse(value, country);
      if (phoneUtil.isValidNumberForRegion(parsed, country)) {
        return true;
      }
    } catch {
      // invalid regional number
    }
  }

  return false;
}

export function validate({
  entity,
  property,
  values,
  schema,
}: {
  entity?: Entity;
  property: Property;
  values: Values;
  schema: Schema;
}): any {
  if (!values || !values.length || (values.length === 1 && values[0] === '')) {
    const isPropRequired = schema.required.indexOf(property.name) > -1;
    return isPropRequired ? validationMessages.required : null;
  }
  const propType = property.type.name;
  if (propType === 'url') {
    return values.some((val) => !isValidUrl(val as string))
      ? validationMessages.invalidUrl
      : null;
  } else if (propType === 'date') {
    const dateRegex = RegExp(
      /^([12]\d{3}(-[01]?[0-9](-[0123]?[0-9]([T ]([012]?\d(:\d{1,2}(:\d{1,2}(\.\d{6})?(Z|[-+]\d{2}(:?\d{2})?)?)?)?)?)?)?)?)?$/
    );
    return values.some((val) => !dateRegex.test(val as string))
      ? validationMessages.invalidDate
      : null;
  } else if (propType === 'country') {
    return values.some((val) => !isValidEnumValue(property, val as string))
      ? validationMessages.invalidCountry
      : null;
  } else if (propType === 'topic') {
    return values.some((val) => !isValidEnumValue(property, val as string))
      ? validationMessages.invalidTopic
      : null;
  } else if (propType === 'phone' && entity !== undefined) {
    return values.some((val) => !isValidPhone(entity, val as string))
      ? validationMessages.invalidPhone
      : null;
  }
  return null;
}

export function checkEntityRequiredProps(entityData: Entity): any {
  const { schema, properties } = entityData;

  const hasMissing = schema.required.some((name: string) => {
    return !entityData.getProperty(name);
  });

  return hasMissing ? validationMessages.required : null;
}
