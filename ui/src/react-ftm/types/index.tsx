import { withTranslator } from 'react-ftm/utils/withTranslator';

import CountBase from './Count';
import Date from './Date';
import EdgeType from './EdgeType';
import Entity, { type FTMEntityExtended } from './Entity';
import EnumValue from './EnumValue';
import FileSize from './FileSize';
import Transliterate from './Transliterate';
import MIMEType from './MIMEType';
import NumericBase from './Numeric';
import Property from './Property';
import Schema from './Schema';
import URL from './URL';

const Count = withTranslator(CountBase);
const Numeric = withTranslator(NumericBase);

export {
  Count,
  Date,
  EdgeType,
  Entity,
  EnumValue as Country,
  EnumValue as Language,
  EnumValue as Topic,
  FileSize,
  FTMEntityExtended,
  Transliterate,
  MIMEType,
  Numeric,
  Property,
  Schema,
  URL,
};
