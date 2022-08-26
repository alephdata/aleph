import { withTranslator } from 'react-ftm/utils';

import ColorPickerBase from './ColorPicker';
import EdgeTypeSelect from './EdgeTypeSelect';
import EntitySelectBase from './EntitySelect';
import EnumValueSelectBase from './EnumValueSelect';
import PropertyEditorBase from './PropertyEditor';
import PropertySelectBase from './PropertySelect';
import RadiusPicker from './RadiusPicker';
import SchemaSelect from './SchemaSelect';
import TextEditBase from './TextEdit';

const EntitySelect = withTranslator(EntitySelectBase);
const EnumValueSelect = withTranslator(EnumValueSelectBase);
const PropertyEditor = withTranslator(PropertyEditorBase);
const PropertySelect = withTranslator(PropertySelectBase);
const TextEdit = withTranslator(TextEditBase);
const ColorPicker = withTranslator(ColorPickerBase);

export {
  ColorPicker,
  EdgeTypeSelect,
  EntitySelect,
  EnumValueSelect as CountrySelect,
  EnumValueSelect as LanguageSelect,
  EnumValueSelect as TopicSelect,
  PropertyEditor,
  PropertySelect,
  RadiusPicker,
  SchemaSelect,
  TextEdit,
};
