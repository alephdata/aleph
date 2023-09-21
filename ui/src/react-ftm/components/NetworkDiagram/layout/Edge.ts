import { Vertex } from './Vertex';
import { Entity, PropertyType, Property } from '@alephdata/followthemoney';
import { GraphLayout } from './GraphLayout';
import { Rectangle } from './Rectangle';
import { Point, IPointData } from './Point';

interface IEdgeData {
  id: string;
  type: string;
  label: string;
  sourceId: string;
  targetId: string;
  labelPosition?: IPointData;
  entityId?: string;
  propertyQName?: string;
  directed: boolean;
}

export class Edge {
  private readonly layout: GraphLayout;
  public readonly id: string;
  public readonly type: string;
  public readonly label: string;
  public readonly sourceId: string;
  public readonly targetId: string;
  public labelPosition?: Point;
  public readonly entityId?: string;
  public readonly propertyQName?: string;
  public readonly directed: boolean = false;

  // temp flag for disposal of outdated nodes
  public garbage = false;

  constructor(layout: GraphLayout, data: IEdgeData) {
    this.layout = layout;
    this.id = data.id;
    this.type = data.type;
    this.label = data.label;
    this.sourceId = data.sourceId;
    this.targetId = data.targetId;
    this.entityId = data.entityId;
    this.labelPosition = data.labelPosition
      ? Point.fromJSON(data.labelPosition)
      : undefined;
    this.propertyQName = data.propertyQName;
  }

  getSource(): Vertex | undefined {
    return this.layout.vertices.get(this.sourceId);
  }

  getTarget(): Vertex | undefined {
    return this.layout.vertices.get(this.targetId);
  }

  isHidden(): boolean {
    const source = this.getSource();
    if (!source || source.isHidden()) {
      return true;
    }
    const target = this.getTarget();
    if (!target || target.isHidden()) {
      return true;
    }
    return false;
  }

  isEntity(): boolean {
    return !!(this.entityId && !this.propertyQName);
  }

  getRect(): Rectangle {
    const source = this.getSource();
    const target = this.getTarget();
    if (source && target) {
      return Rectangle.fromPoints(source.position, target.position);
    }
    return new Rectangle(0, 0, 0, 0);
  }

  getCenter(): Point {
    return this.getRect().getCenter();
  }

  isLinkedToVertex(vertex: Vertex): boolean {
    return this.sourceId === vertex.id || this.targetId === vertex.id;
  }

  update(other: Edge): Edge {
    const data = other.toJSON();
    if (this.labelPosition) {
      data.labelPosition = this.labelPosition.toJSON();
    }

    // TODO: remove if there are no changes
    return Edge.fromJSON(this.layout, data);
  }

  clone(): Edge {
    return Edge.fromJSON(this.layout, this.toJSON());
  }

  getLabelPosition() {
    return this.labelPosition;
  }

  setLabelPosition(labelPosition?: Point): Edge {
    const edge = this.clone();
    edge.labelPosition = labelPosition;
    return edge;
  }

  toJSON(): IEdgeData {
    return {
      id: this.id,
      type: this.type,
      label: this.label,
      sourceId: this.sourceId,
      targetId: this.targetId,
      entityId: this.entityId,
      labelPosition: this.labelPosition && this.labelPosition.toJSON(),
      propertyQName: this.propertyQName,
      directed: this.directed,
    };
  }

  static fromJSON(layout: GraphLayout, data: any): Edge {
    return new Edge(layout, data as IEdgeData);
  }

  static fromEntity(
    layout: GraphLayout,
    entity: Entity,
    source: Vertex,
    target: Vertex
  ): Edge {
    return new Edge(layout, {
      id: `${entity.id}(${source.id}, ${target.id})`,
      type: PropertyType.ENTITY,
      label: entity.getEdgeCaption(),
      sourceId: source.id,
      targetId: target.id,
      entityId: entity.id,
      directed: entity.schema?.edge?.directed || false,
    });
  }

  static fromValue(
    layout: GraphLayout,
    property: Property,
    source: Vertex,
    target: Vertex
  ) {
    if (!source.entityId) {
      throw new Error('No source entity for value edge.');
    }
    return new Edge(layout, {
      id: `${source.entityId}:${property.qname}(${target.id})`,
      type: property.type.name,
      label: property.label,
      sourceId: source.id,
      targetId: target.id,
      entityId: source.entityId,
      propertyQName: property.qname,
      directed: false,
    });
  }
}
