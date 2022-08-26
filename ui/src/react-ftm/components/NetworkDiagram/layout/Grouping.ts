import { Vertex } from './Vertex';
import { GraphLayout } from './GraphLayout';
import { Rectangle } from './Rectangle';

interface IGroupingData {
  id: string;
  label?: string;
  color: string;
  vertices: Array<string>;
}

export class Grouping {
  private readonly layout: GraphLayout;
  public readonly id: string;
  public readonly label: string | undefined;
  public color: string;
  public readonly vertices: Set<string>;

  constructor(layout: GraphLayout, data: IGroupingData) {
    this.layout = layout;
    this.id = data.id;
    this.label = data.label;
    this.color = data.color;
    this.vertices = new Set(data.vertices);
  }

  setColor(color: string): Grouping {
    const grouping = this.clone();
    grouping.color = color;
    return grouping;
  }

  hasVertex(vertex: Vertex): boolean {
    return this.vertices.has(vertex.id);
  }

  addVertex(vertex: Vertex): Grouping {
    this.vertices.add(vertex.id);
    return this;
  }

  removeVertex(vertex: Vertex): Grouping {
    if (this.hasVertex(vertex)) {
      this.vertices.delete(vertex.id);
    }
    return this;
  }

  getVertexIds(): Array<string> {
    return Array.from(this.vertices);
  }

  getVertices(): Array<Vertex> {
    return this.getVertexIds()
      .map((vertexId) => this.layout.vertices.get(vertexId))
      .filter((v) => v !== undefined) as Vertex[];
  }

  getEntityIds(): Array<string> {
    return this.layout.getEntityIds(...this.getVertices());
  }

  getBoundingRect(): Rectangle {
    const { config } = this.layout;
    const points = this.getVertices().map((v) =>
      config.gridToPixel(v.position)
    );
    return Rectangle.fromPoints(...points).pad(config.gridUnit * 2);
  }

  clone(): Grouping {
    return Grouping.fromJSON(this.layout, this.toJSON());
  }

  toJSON(): IGroupingData {
    return {
      id: this.id,
      label: this.label,
      color: this.color,
      vertices: this.getVertexIds(),
    };
  }

  static fromJSON(layout: GraphLayout, data: any): Grouping {
    return new Grouping(layout, data as IGroupingData);
  }

  static fromVertices(
    layout: GraphLayout,
    label: string,
    vertices: Vertex[],
    color?: string
  ): Grouping {
    return new Grouping(layout, {
      id: `${vertices.map((v) => v.id)}`,
      label: label,
      color: color || layout.config.DEFAULT_VERTEX_COLOR,
      vertices: vertices.map((v) => v.id),
    });
  }

  static fromSelection(layout: GraphLayout, vertices: Vertex[]): Grouping {
    return new Grouping(layout, {
      id: 'selectedArea',
      color: layout.config.UNSELECTED_COLOR,
      vertices: vertices.map((v) => v.id),
    });
  }
}
