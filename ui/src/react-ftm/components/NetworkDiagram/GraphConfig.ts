import { Colors } from '@blueprintjs/core';
import { Point } from 'react-ftm/components/NetworkDiagram/layout';
import { GraphLogo } from 'react-ftm/components/common';

export interface IGraphConfig {
  gridUnit?: number;
  editorTheme?: string;
  toolbarPosition?: string;
  logo?: GraphLogo;
}

export class GraphConfig {
  public DEFAULT_VERTEX_COLOR: string = Colors.BLUE1;
  public EDGE_COLOR: string = Colors.GRAY2;
  public UNSELECTED_COLOR: string = Colors.GRAY5;
  public DEFAULT_VERTEX_RADIUS = 1;
  public gridUnit: number;
  public editorTheme: string;
  public toolbarPosition: string;
  public logo: GraphLogo | undefined;

  constructor(props?: IGraphConfig) {
    this.gridUnit = props?.gridUnit || 10;
    this.editorTheme = props?.editorTheme || 'dark';
    this.toolbarPosition = props?.toolbarPosition || 'top';
    this.logo = props?.logo;
  }

  gridToPixel(point: Point): Point {
    return new Point(point.x * this.gridUnit, point.y * this.gridUnit);
  }

  pixelToGrid(point: Point): Point {
    return new Point(point.x / this.gridUnit, point.y / this.gridUnit);
  }
}
