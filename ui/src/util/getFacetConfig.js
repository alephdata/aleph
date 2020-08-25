import {
  defineMessages,
} from 'react-intl';

const messages = defineMessages({
  facet_schema: {
    id: 'facet.schema',
    defaultMessage: '{count, plural, zero {Types} one {Type} two {Types} few {Types} many {Types} other {Types}}',
  },
  facet_collection_id: {
    id: 'facet.collection_id',
    defaultMessage: '{count, plural, zero {Datasets} one {Dataset} two {Datasets} few {Datasets} many {Datasets} other {Datasets}}',
  },
  facet_ibans: {
    id: 'facet.ibans',
    defaultMessage: '{count, plural, zero {IBANs} one {IBAN} two {IBANs} few {IBANs} many {IBANs} other {IBANs}}',
  },
  facet_languages: {
    id: 'facet.languages',
    defaultMessage: '{count, plural, zero {Languages} one {Language} two {Languages} few {Languages} many {Languages} other {Languages}}',
  },
  facet_emails: {
    id: 'facet.emails',
    defaultMessage: '{count, plural, zero {E-Mails} one {E-Mail} two {E-Mails} few {E-Mails} many {E-Mails} other {E-Mails}}',
  },
  facet_phones: {
    id: 'facet.phones',
    defaultMessage: '{count, plural, zero {Phone numbers} one {Phone number} two {Phone numbers} few {Phone numbers} many {Phone numbers} other {Phone numbers}}',
  },
  facet_countries: {
    id: 'facet.countries',
    defaultMessage: '{count, plural, zero {Countries} one {Country} two {Countries} few {Countries} many {Countries} other {Countries}}',
  },
  facet_names: {
    id: 'facet.names',
    defaultMessage: '{count, plural, zero {Names} one {Name} two {Names} few {Names} many {Names} other {Names}}',
  },
  facet_addresses: {
    id: 'facet.addresses',
    defaultMessage: '{count, plural, zero {Addresses} one {Address} two {Addresses} few {Addresses} many {Addresses} other {Addresses}}',
  },
  facet_mime_type: {
    id: 'facet.mimetypes',
    defaultMessage: '{count, plural, zero {File types} one {File type} two {File types} few {File types} many {File types} other {File types}}',
  },
  facet_category: {
    id: 'facet.category',
    defaultMessage: '{count, plural, zero {Categories} one {Category} two {Categories} few {Categories} many {Categories} other {Categories}}',
  },
});

const propConfigs = {
  addresses: {
    field: 'addresses',
    label: messages.facet_addresses,
    icon: 'map',
  },
  category: {
    field: 'category',
    label: messages.facet_category,
    icon: 'list',
    defaultSize: 1000,
  },
  collection_id: {
    field: 'collection_id',
    label: messages.facet_collection_id,
    icon: 'database',
  },
  match_collection_id: {
    field: 'match_collection_id',
    label: messages.facet_collection_id,
    icon: 'database',
    defaultSize: 10,
  },
  countries: {
    field: 'countries',
    label: messages.facet_countries,
    icon: 'globe',
    defaultSize: 1000,
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
    defaultSize: 1000,
  },
};

const getFacetConfig = (key) => (
  propConfigs[key]
);

export default getFacetConfig;
