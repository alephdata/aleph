import {
  defineMessages,
} from 'react-intl';

const messages = defineMessages({
  facet_schema: {
    id: 'facet.schema',
    defaultMessage: '{count, plural, one {Type} other {Types}}',
  },
  facet_collection_id: {
    id: 'facet.collection_id',
    defaultMessage: '{count, plural, one {Dataset} other {Datasets}}',
  },
  facet_ibans: {
    id: 'facet.ibans',
    defaultMessage: '{count, plural, one {Iban number} other {Iban numbers}}',
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

const propLabels = {
  addresses: {
    field: 'addresses',
    label: messages.facet_addresses,
    icon: 'map',
  },
  category: {
    field: 'category',
    label: messages.facet_category,
    icon: 'list',
  },
  collection_id: {
    field: 'collection_id',
    label: messages.facet_collection_id,
    icon: 'database',
  },
  countries: {
    field: 'countries',
    label: messages.facet_countries,
    icon: 'globe',
    defaultSize: 300,
  },
  emails: {
    field: 'emails',
    label: messages.facet_emails,
    icon: 'envelope',
  },
  ibans: {
    field: 'ibans',
    label: messages.facet_ibans,
    icon: 'credit-card',
  },
  languages: {
    field: 'languages',
    label: messages.facet_languages,
    icon: 'translate',
  },
  mimetypes: {
    field: 'mimetypes',
    label: messages.facet_mime_type,
    icon: 'document',
  },
  names: {
    field: 'names',
    label: messages.facet_names,
    icon: 'id-number',
  },
  phones: {
    field: 'phones',
    label: messages.facet_phones,
    icon: 'phone',
  },
  schema: {
    field: 'schema',
    label: messages.facet_schema,
    icon: 'list-columns',
  },
};

const getFacetLabel = (key) => (
  propLabels[key]
);

export default getFacetLabel;
