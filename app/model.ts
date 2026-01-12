export type ToolType = "select" | "pen" | "table" | "chair";

export interface ShapeBase {
  id: string;
  x: number;
  y: number;
  radius: number;
}

export interface TableShape extends ShapeBase {
  type: "table";
  seats: number;
  seatRadius: number;
}

export type Shape = TableShape ;

export interface EditorState {
  tool: ToolType;
  shapes: Shape[];
  selectedId: string | null;
 
}
