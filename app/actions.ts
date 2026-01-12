export const setTool = (tool: any) => ({
  type: "SET_TOOL",
  payload: tool,
});

export const addShape = (shape: any) => ({
  type: "ADD_SHAPE",
  payload: shape,
});

export const moveShape = (id: string, x: number, y: number) => ({
  type: "MOVE_SHAPE",
  payload: { id, x, y },
});

export const updateSeats = (id: string, seats: number) => ({
  type: "UPDATE_SEATS",
  payload: { id, seats },
});

export const selectShape = (id: string | null) => ({
  type: "SELECT_SHAPE",
  payload: id,
});

export const resetEditor = () => ({
  type: "RESET_EDITOR",
});
export const updateTableColor = (id: string, fill: string) => ({
  type: "UPDATE_TABLE_COLOR",
  payload: { id, fill },
});
export const updateTableSeats = (id: string, seats: any) => ({
  type: "UPDATE_TABLE_SEATS",
  payload: { id, seats },
});
export const updateColor = (id: string, fill: string) => ({
  type: "UPDATE_COLOR",
  payload: { id, fill },
});
export const updateLabel = (id: string, label: string) => ({
  type: "UPDATE_LABEL",
  payload: { id, label },
});

export const addText = (payload: any) => ({
  type: "ADD_TEXT",
  payload,
});

export const updateText = (id: string, text: string) => ({
  type: "UPDATE_TEXT",
  payload: { id, text },
});
export const updateTableLabel = (id: string, label: string) => ({
  type: "UPDATE_TABLE_LABEL",
  payload: { id, label },
});
export const updateShapeLabel = (id: string, label: string) => ({
  type: "UPDATE_SHAPE_LABEL",
  payload: { id, label },
});

export const deleteShape = (id: String) => ({
  type : "DELETE_SHAPE",
  payload : { id },
});


export const penStart = (x: number, y: number) => ({
  type: "PEN_START",
  payload: { x, y },
});

export const penAddPoint = (x: number, y: number) => ({
  type: "PEN_ADD_POINT",
  payload: { x, y },
});

export const penUpdateTemp = (x: number, y: number) => ({
  type: "PEN_UPDATE_TEMP",
  payload: { x, y },
});

export const penFinish = (id: string) => ({
  type: "PEN_FINISH",
  payload: { id },
});

export const penCancel = () => ({
  type: "PEN_CANCEL",
});
export const updatePenStroke = (id: string, strokeWidth: number) => ({
  type: "UPDATE_PEN_STROKE",
  payload: { id, strokeWidth },
});
export const generateZoneSeats = (rectId: string) => ({
  type: "GENERATE_ZONE_SEATS",
  payload: { rectId },
});
// ===============================
// SEAT ZONE ACTIONS (NEW)
// ===============================

export const updateShapeSize = (
  id: string,
  payload: Partial<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>
) => ({
  type: "UPDATE_SHAPE_SIZE",
  payload: { id, ...payload },
});


export const addSeatZone = (payload: {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}) => ({
  type: "ADD_SEAT_ZONE",
  payload,
});

export const updateSeatZoneConfig = (
  id: string,
  config: {
    seatWidth?: number;
    seatHeight?: number;
    seatCount?: number;
  }
) => ({
  type: "UPDATE_SEAT_ZONE_CONFIG",
  payload: { id, config },
});

export const generateSeatZoneItems = (zoneId: string) => ({
  type: "GENERATE_SEAT_ZONE_ITEMS",
  payload: { zoneId },
});
export const GENERATE_SEATS_IN_SHAPE = "GENERATE_SEATS_IN_SHAPE";

export const generateSeatsInShape = (shapeId: string, rows: number, cols: number) => ({
    type: GENERATE_SEATS_IN_SHAPE,
    payload: { shapeId, rows, cols }
});

