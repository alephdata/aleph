import { defineMessages } from 'react-intl';

export const GROUP_FIELDS = [
  'dates', 'schema', 'countries', 'languages', 'emails', 'phones', 'names', 'addresses', 'mimetypes'
];

const messages = defineMessages({
  facet_dates: {
    id: 'facet.dates',
    defaultMessage: '{count, plural, one {Date} other {Dates}}',
  },
  facet_schema: {
    id: 'facet.schema',
    defaultMessage: 'Entity type',
  },
  facet_collection_id: {
    id: 'facet.collection_id',
    defaultMessage: 'Dataset',
  },
  facet_ibans: {
    id: 'facet.ibans',
    defaultMessage: '{count, plural, one {IBAN} other {IBANs}}',
  },
  facet_languages: {
    id: 'facet.languages',
    defaultMessage: '{count, plural, one {Language} other {Languages}}',
  },
  facet_emails: {
    id: 'facet.emails',
    defaultMessage: '{count, plural, one {E-Mail} other {E-Mails}}',
  },
  facet_phones: {
    id: 'facet.phones',
    defaultMessage: '{count, plural, one {Phone number} other {Phone numbers}}',
  },
  facet_caption: {
    id: 'facet.caption',
    defaultMessage: 'Name',
  },
  facet_countries: {
    id: 'facet.countries',
    defaultMessage: '{count, plural, one {Country} other {Countries}}',
  },
  facet_names: {
    id: 'facet.names',
    defaultMessage: '{count, plural, one {Name} other {Names}}',
  },
  facet_addresses: {
    id: 'facet.addresses',
    defaultMessage: '{count, plural, one {Address} other {Addresses}}',
  },
  facet_mime_type: {
    id: 'facet.mimetypes',
    defaultMessage: '{count, plural, one {File type} other {File types}}',
  },
  facet_category: {
    id: 'facet.category',
    defaultMessage: '{count, plural, one {Category} other {Categories}}',
  },
});

const configs = {
  addresses: {
    name: 'addresses',
    label: messages.facet_addresses,
    icon: 'map',
    defaultSize: 30,
  },
  caption: {
    name: 'caption',
    label: messages.facet_caption,
  },
  category: {
    name: 'category',
    label: messages.facet_category,
    icon: 'list',
    defaultSize: 1000,
  },
  collection_id: {
    name: 'collection_id',
    label: messages.facet_collection_id,
    icon: 'database',
  },
  match_collection_id: {
    name: 'match_collection_id',
    label: messages.facet_collection_id,
    icon: 'database',
    defaultSize: 10,
  },
  dates: {
    name: 'dates',
    label: messages.facet_dates,
    icon: 'calendar',
  },
  countries: {
    name: 'countries',
    label: messages.facet_countries,
    icon: 'globe',
    defaultSize: 1000,
  },
  emails: {
    name: 'emails',
    label: messages.facet_emails,
    icon: 'envelope',
  },
  ibans: {
    name: 'ibans',
    label: messages.facet_ibans,
    icon: 'credit-card',
  },
  languages: {
    name: 'languages',
    label: messages.facet_languages,
    icon: 'translate',
  },
  mimetypes: {
    name: 'mimetypes',
    label: messages.facet_mime_type,
    icon: 'document',
  },
  names: {
    name: 'names',
    label: messages.facet_names,
    icon: 'id-number',
    defaultSize: 30,
  },
  phones: {
    name: 'phones',
    label: messages.facet_phones,
    icon: 'phone',
  },
  schema: {
    name: 'schema',
    label: messages.facet_schema,
    icon: 'layout-grid',
    defaultSize: 1000,
  },
};

export const getGroupField = (key) => (
  configs[key]
);
