import { withTranslator } from 'react-ftm/utils';
import { EntityTable as EntityTableBase } from './EntityTable';
import { TableEditor as TableEditorBase } from './TableEditor';

const EntityTable = withTranslator(EntityTableBase);
const TableEditor = withTranslator(TableEditorBase);

export { EntityTable, TableEditor };
