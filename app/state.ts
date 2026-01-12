export type ToolType = "select" | "pen" | "table" | "chair";

export interface ShapeBase {
  id: string;
  x: number;
  y: number;
}

export interface TableShape extends ShapeBase {
  type: "table";
  radius: number;
  seats: number;
  seatRadius: number;
}

export interface ChairShape extends ShapeBase {
  type: "chair";
  radius: number;
  tableId?: string;
}

export interface PenStroke {
  id: string;
  points: number[];
}

export type Shape = TableShape | ChairShape;

export interface EditorState {
  tool: ToolType;
  shapes: Shape[];
  strokes: PenStroke[];
  selectedId: string | null;
}
