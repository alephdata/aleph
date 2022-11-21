import {
  Entity,
  Property,
  PropertyType,
  Value,
} from '@alephdata/followthemoney';
import { Point, IPointData } from './Point';
import { GraphLayout } from './GraphLayout';
import { Edge } from './Edge';

interface IVertexData {
  id: string;
  type: string;
  label: string;
  fixed: boolean;
  hidden: boolean;
  color: string;
  radius: number;
  position?: IPointData;
  entityId?: string;
}

export class Vertex {
  public readonly layout: GraphLayout;
  public readonly id: string;
  public readonly type: string;
  public readonly label: string;
  public readonly entityId?: string;
  public fixed: boolean;
  public hidden: boolean;
  public color: string;
  public radius: number;
  public position: Point;
  public garbage = false;

  constructor(layout: GraphLayout, data: IVertexData) {
    this.layout = layout;
    this.id = data.id;
    this.type = data.type;
    this.label = data.label;
    this.fixed = data.fixed;
    this.hidden = data.hidden;
    this.color = data.color;
    this.radius = data.radius;
    this.position = data.position ? Point.fromJSON(data.position) : new Point();
    this.entityId = data.entityId;
  }

  getOwnEdges(): Edge[] {
    return this.layout
      .getEdges()
      .filter((edge) => edge.sourceId === this.id || edge.targetId === this.id);
  }

  getDegree(): number {
    return this.getOwnEdges().length;
  }

  isHidden(): boolean {
    return (
      this.hidden ||
      (this.type !== PropertyType.ENTITY && this.getDegree() <= 1)
    );
  }

  isEntity(): boolean {
    return !!this.entityId;
  }

  clone(): Vertex {
    return Vertex.fromJSON(this.layout, this.toJSON());
  }

  getPosition(): Point {
    return this.position;
  }

  setPosition(position: Point): Vertex {
    const vertex = this.clone();
    vertex.position = position;
    vertex.fixed = true;
    return vertex;
  }

  snapPosition(fuzzy: Point): Vertex {
    return this.setPosition(
      new Point(Math.round(fuzzy.x), Math.round(fuzzy.y))
    );
  }

  setColor(color: string): Vertex {
    const vertex = this.clone();
    vertex.color = color;
    return vertex;
  }

  setRadius(radius: number): Vertex {
    const vertex = this.clone();
    vertex.radius = radius;
    return vertex;
  }

  update(other: Vertex): Vertex {
    const data = other.toJSON();
    data.hidden = this.hidden;
    data.fixed = this.fixed;
    data.color = this.color;
    data.radius = this.radius;
    data.position = this.position.toJSON();
    return Vertex.fromJSON(this.layout, data);
  }

  toJSON(): IVertexData {
    return {
      id: this.id,
      type: this.type,
      label: this.label,
      fixed: this.fixed,
      hidden: this.hidden,
      color: this.color,
      radius: this.radius,
      position: this.position.toJSON(),
      entityId: this.entityId,
    };
  }

  static fromJSON(layout: GraphLayout, data: any): Vertex {
    return new Vertex(layout, data as IVertexData);
  }

  static fromEntity(layout: GraphLayout, entity: Entity): Vertex {
    const type = PropertyType.ENTITY;
    if (entity.schema.isEdge) {
      throw new Error('Cannot make vertex from edge entity.');
    }
    return new Vertex(layout, {
      id: `${type}:${entity.id}`,
      type: type,
      label: entity.getCaption(),
      fixed: false,
      hidden: false,
      color: layout.config.DEFAULT_VERTEX_COLOR,
      radius: layout.config.DEFAULT_VERTEX_RADIUS,
      entityId: entity.id,
    });
  }

  static fromValue(
    layout: GraphLayout,
    property: Property,
    value: Value
  ): Vertex | null {
    if (
      property.type.name === PropertyType.ENTITY ||
      typeof value !== 'string'
    ) {
      if (typeof value !== 'string') {
        return Vertex.fromEntity(layout, value);
      } else {
        return null;
      }
    }
    const type = property.type.name;
    return new Vertex(layout, {
      id: `${type}:${value}`,
      type: type,
      label: value,
      fixed: false,
      hidden: false,
      color: 'GRAY',
      radius: layout.config.DEFAULT_VERTEX_RADIUS / 2,
    });
  }
}
