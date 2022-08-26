import { Values } from '@alephdata/followthemoney';

export interface ITypeEditorProps {
  values: Values;
  onSubmit: (values: Values) => void;
  popoverProps?: any;
  inputProps?: any;
}
