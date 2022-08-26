import { withTranslator } from 'react-ftm/utils';
import { NetworkDiagram as NetworkDiagramBase } from './NetworkDiagram';
const NetworkDiagram = withTranslator(NetworkDiagramBase);

export { NetworkDiagram, NetworkDiagram as VisGraph };
export * from './GraphConfig';
export * from './Viewport';
export { GraphLayout } from './layout';
export { exportSvg } from './utils';
