/* ===========================
   TOOL
=========================== */
import { isPointInPoly } from "./geometry";
import { v4 as uuid } from "uuid";
import { GENERATE_SEATS_IN_SHAPE } from "./actions";
export type ToolType =
  | "select"
  | "pen"
  | "rect"
  | "roundTable"
  | "rectTable"
  | "headTable"
  | "chair"
  | "text"
  | "seat"
  | "seatZone"
  | "box" 
  | "rowseat";

/* ===========================
   TABLE
=========================== */
export type TableKind = "round" | "rect" | "head";

export interface BoxShape {
  id: string;
  type: "box";
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface RowSeatShape {
  id: string;
  type: "rowseat";
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface RowSeatItemShape {
  id: string;
  type: "rowseat-item";
  parentId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}




export interface TableShape {
  id: string;
  type: "table";
  kind: TableKind;
  x: number;
  y: number;
  seats: number;
  seatRadius: number;
  radius?: number;
  width?: number;
  height?: number;
  label: string;
  fill: string;
}

/* ===========================
   RECT
=========================== */
export interface RectShape {
  id: string;
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  parentId?: string | null; // Link to the Pen Shape
  groupId?: string | null;
}








/* ===========================
   CHAIR
=========================== */
export interface ChairShape {
  id: string;
  type: "chair";
  x: number;
  y: number;
  parentTableId: string | null;
  fill: string;
}
export interface TextShape {
  id: string;
  type: "text";
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  parentId: string | null; // table / rect id or null
}
export interface PenPoint {
  x: number;
  y: number;
}

export interface PenShape {
  groupId: string |null;
  id: string;
  type: "pen";
  // x: number;
  // y: number;
  points: PenPoint[];
  stroke: string;
  strokeWidth: number;
  
} 


/* ===========================
   UNION
=========================== */
export type Shape = TableShape | RectShape | ChairShape | TextShape | PenShape | BoxShape | RowSeatShape  | RowSeatItemShape;

/* ===========================
   STATE
=========================== */
export interface EditorState {
  tool: ToolType;
  shapes: Shape[];
  selectedId: string | null;
   penDraft: {
    isDrawing: boolean;
    points: PenPoint[];
    tempPoint: { x: number; y: number } | null;
  };
   editingPenId: string | null;
    editingPointIndex: number | null;
  
}
export const initialState: EditorState = {
  tool: "select",
  shapes: [],
  selectedId: null,

  penDraft: {
    isDrawing: false,
    points: [],
    tempPoint: null,
  },

  editingPenId: null, 
   editingPointIndex:  null,
};
const getPolygonArea = (points: { x: number; y: number }[]) => {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
        const j = (i + 1) % points.length;
        area += points[i].x * points[j].y;
        area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
};

// Helper to find shape width at a specific Y coordinate
function findXIntersectionsAtY(y: number, points: {x: number, y: number}[]) {
    const xCoords = [];
    for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
            const x = p1.x + (y - p1.y) * (p2.x - p1.x) / (p2.y - p1.y);
            xCoords.push(x);
        }
    }
    return xCoords.sort((a, b) => a - b);
}
const getShapeAngle = (p1: {x: number, y: number}, p2: {x: number, y: number}) => {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x);
};

// Helper: Rotate a point around an origin
const rotatePoint = (px: number, py: number, cx: number, cy: number, angle: number) => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const nx = (cos * (px - cx)) + (sin * (py - cy)) + cx;
    const ny = (cos * (py - cy)) - (sin * (px - cx)) + cy;
    return { x: nx, y: ny };
};

/* ===========================
   REDUCER
=========================== */
export function reducer(
  state: EditorState = initialState,
  action: any
): EditorState {
  switch (action.type) {
    /* ---------- TOOL ---------- */
    case "SET_TOOL":
      return {
        ...state,
    tool: action.payload as ToolType,
    editingPenId: null, // 🔥 EXIT EDIT MODE
    selectedId: null,
      };

    /* ---------- ADD ---------- */
  case "ADD_SHAPE": {
  const payload = action.payload as Shape;

  // Non-table → add normally
  if (payload.type !== "table") {
    return {
      ...state,
      shapes: [...state.shapes, payload],
      selectedId: payload.id,
    };
  }

  // TABLE → create chairs once
  const chairs: ChairShape[] = Array.from(
    { length: payload.seats },
    (_, i) => {
      let cx = payload.x;
      let cy = payload.y;

      // ROUND TABLE
      if (payload.kind === "round") {
        const angle = (2 * Math.PI * i) / payload.seats;
        cx += payload.seatRadius * Math.cos(angle);
        cy += payload.seatRadius * Math.sin(angle);
      }

      // RECT / HEAD TABLE
      else {
        const gap = payload.width! / (payload.seats + 1);
        cx += -payload.width! / 2 + gap * (i + 1);
        cy += payload.height! / 2 + 22;
      }

      return {
        id: `${payload.id}-chair-${i}`,
        type: "chair",
        parentTableId: payload.id,
        x: cx,
        y: cy,
        fill: "#000",
      };
    }
  );

  return {
    ...state,
    shapes: [...state.shapes, payload, ...chairs],
    selectedId: payload.id,
  };
}


    /* ---------- MOVE ---------- */
    // case "MOVE_SHAPE": {
    //   const { id, x, y } = action.payload;

    //   const target = state.shapes.find((s) => s.id === id);
    //   if (!target) return state;

    //   /* MOVE TABLE + ITS CHAIRS */
    //   if (target.type === "table") {
    //     const dx = x - target.x;
    //     const dy = y - target.y;

    //     return {
    //       ...state,
    //       shapes: state.shapes.map((s) => {
    //         if (s.id === id) return { ...s, x, y };

    //         if (
    //           s.type === "chair" &&
    //           s.parentTableId === id
    //         ) {
    //           return {
    //             ...s,
    //             x: s.x + dx,
    //             y: s.y + dy,
    //           };
    //         }

    //         return s;
    //       }),
    //     };
    //   }

    //   /* MOVE CHAIR / RECT */
    //   return {
    //     ...state,
    //     shapes: state.shapes.map((s) =>
    //       s.id === id ? { ...s, x, y } : s
    //     ),
    //   };
    // }
    case "MOVE_SHAPE": {
      const { id, x, y } = action.payload;

      const target = state.shapes.find((s) => s.id === id);
      if (!target) return state;

      // Calculate the difference between new position and old position
      // We use 'as any' to access x/y safely on target
      const dx = x - (target as any).x || 0;
      const dy = y - (target as any).y || 0;

      /* MOVE TABLE + ITS CHAIRS */
      if (target.type === "table") {
        const dxTable = x - target.x;
        const dyTable = y - target.y;

        return {
          ...state,
          shapes: state.shapes.map((s) => {
            if (s.id === id) return { ...s, x, y };

            if (
              s.type === "chair" &&
              s.parentTableId === id
            ) {
              return {
                ...s,
                x: s.x + dxTable,
                y: s.y + dyTable,
              };
            }

            return s;
          }),
        };
      }

      /* 🔥 ADDED: MOVE GROUP (PEN + SEATS) */
      if ((target as any).groupId) {
        return {
          ...state,
          shapes: state.shapes.map((s: any) => {
            if (s.groupId === (target as any).groupId) {
              // If it's a pen tool, move all its points
              if (s.type === "pen") {
                return {
                  ...s,
                  points: s.points.map((p: any) => ({
                    x: p.x + dx,
                    y: p.y + dy,
                  })),
                };
              }
              // If it's a seat (rect), move its x and y
              return {
                ...s,
                x: s.x + dx,
                y: s.y + dy,
              };
            }
            return s;
          }),
        };
      }

      /* MOVE CHAIR / RECT / PEN (Individual) */
      return {
        ...state,
        shapes: state.shapes.map((s) => {
          if (s.id === id) {
            // If dragging a single pen without a group, move its points
            if (s.type === "pen") {
              return {
                ...s,
                points: s.points.map((p: any) => ({
                  x: p.x + dx,
                  y: p.y + dy,
                })),
              };
            }
            return { ...s, x, y };
          }
          return s;
        }),
      };
    }
    /* ---------- PEN TOOL ---------- */

case "PEN_START":
  return {
    ...state,
    penDraft: {
      isDrawing: true,
                points: [action.payload],
                

      tempPoint: null,
    },
    selectedId: null,
  };

case "PEN_ADD_POINT":
  return {
    ...state,
    penDraft: {
      ...state.penDraft,
      points: [...state.penDraft.points, action.payload],
    },
  };
  case "PEN_PREVIEW":
  return {
    ...state,
    penDraft: {
      ...state.penDraft,
      tempPoint: action.payload, // mouse move only
    },
  };

case "PEN_UPDATE_TEMP":
  return {
    ...state,
    penDraft: {
      ...state.penDraft,
      tempPoint: action.payload,
    },
  };

case "PEN_FINISH": {
  if (state.penDraft.points.length < 2) {
    return {
      ...state,
      penDraft: initialState.penDraft,
      tool: "select",
        editingPenId: null, 
    };
  }

  const pen: PenShape = {
    id: state.editingPenId ?? action.payload.id,
    type: "pen",
    points: state.penDraft.points, // 🔥 ONLY FIXED ANCHORS
    stroke: "#000",
    strokeWidth: 2,
    groupId: null
  };

  return {
    ...state,
    shapes: state.editingPenId
      ? state.shapes.map(s =>
          s.id === state.editingPenId ? pen : s
        )
      : [...state.shapes, pen],
    penDraft: initialState.penDraft,
    tool: "select",
     editingPenId: null,
    selectedId: pen.id,
  };
}
case "SELECT_SHAPE": {
  const id = action.payload;

  const selectedPen =
    state.shapes.find(
      (s) => s.id === id && s.type === "pen"
    ) ?? null;

  return {
    ...state,
    selectedId: id,
    editingPenId: selectedPen ? selectedPen.id : null,
  };
}




case "PEN_CANCEL":
  return {
    ...state,
    penDraft: initialState.penDraft,
    tool: "select",
  };
  case "UPDATE_PEN_STROKE":
  return {
    ...state,
    shapes: state.shapes.map(s =>
      s.type === "pen" && s.id === action.payload.id
        ? { ...s, strokeWidth: action.payload.strokeWidth }
        : s
    ),
  };

  
case "PEN_EDIT_START": {
  const pen = state.shapes.find(
    (s) => s.id === action.payload.penId && s.type === "pen"
  ) as any;

  if (!pen) return state;

  return {
    ...state,
    tool: "pen",
    editingPenId: pen.id,
    selectedId: pen.id,
    penDraft: {
      isDrawing: true,
      points: [...pen.points], // 🔥 LOAD EXISTING POINTS
      tempPoint: null,
    },
  };
}

/* ===========================
   CORRECTED SEAT GENERATION
=========================== */
// case "GENERATE_SEATS_IN_SHAPE": {
//     const { shapeId, rows, cols } = action.payload;
//     const shape = state.shapes.find((s: any) => s.id === shapeId);
//     const boxSize = 8
    
//     // Ensure the shape has at least 4 points to define a perspective area
//     if (!shape || shape.type !== "pen" || !shape.points || shape.points.length < 4) {
//         alert("Please draw a 4-corner area for the seats to align correctly.");
//         return state;
//     }

//     const p = shape.points;
//     const autoSeats: any[] = [];

//     // Calculate the 'Front' angle based on the top edge of your shape
//     const angle = Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x);

//     for (let r = 0; r < rows; r++) {
//         for (let c = 0; c < cols; c++) {
//             // Normalize coordinates (0 to 1) for the grid
//             // We add a small offset (0.05) to keep seats away from the very edge
//             const u = cols > 1 ? (c / (cols - 1)) * 0.9 + 0.05 : 0.5;
//             const v = rows > 1 ? (r / (rows - 1)) * 0.9 + 0.05 : 0.5;

//             /**
//              * PERSPECTIVE TRANSFORM (Bilinear Interpolation)
//              * This forces the grid to follow the slanted lines of your pen shape.
//              * If the top is narrower than the bottom, seats will naturally get closer together.
//              */
//             const gx = (1 - u) * (1 - v) * p[0].x + 
//                        u * (1 - v) * p[1].x + 
//                        u * v * p[2].x + 
//                        (1 - u) * v * p[3].x;

//             const gy = (1 - u) * (1 - v) * p[0].y + 
//                        u * (1 - v) * p[1].y + 
//                        u * v * p[2].y + 
//                        (1 - u) * v * p[3].y;

//             // Strict point-in-polygon check to prevent any seat from rendering outside
//             if (isPointInPoly({ x: gx, y: gy }, p)) {
//     autoSeats.push({
//         id: uuid(),
//         type: "rect", // Changed from "chair" to "rect"
//         isManual: true,
//         x: gx - boxSize / 2, // Center the box on the coordinate
//         y: gy - boxSize / 2,
//         width: boxSize,
//         height: boxSize,
//         rotation: (angle * 180) / Math.PI, 
//         fill: "white",
//         stroke: "#333", // Darker border for better visibility
//         strokeWidth: 1,
//         parentId: shapeId,
//     });
// }
//         }
//     }

//     return {
//         ...state,
//         shapes: [...state.shapes, ...autoSeats],
//         selectedId: null,
//     };
// }
case "GROUP_SHAPE_AND_SEATS": {
        const { shapeId } = action.payload;
        const newId = uuid();
        return {
            ...state,
            shapes: state.shapes.map((s: any) => {
                // IMPORTANT: ParentId is the link between seats and the pen shape
                if (s.id === shapeId || s.parentId === shapeId) {
                    return { ...s, groupId: newId };
                }
                return s;
            })
        };
    }
case "GENERATE_SEATS_IN_SHAPE": {
    const { shapeId, rows, cols } = action.payload;
    const shape = state.shapes.find((s: any) => s.id === shapeId);
    
    if (!shape || shape.type !== "pen" || !shape.points || shape.points.length < 4) return state;

    // 1. DYNAMIC CLEANUP: Remove any existing seats that belong to this shape 
    // This allows the grid to "refresh" whenever rows/cols change
    const otherShapes = state.shapes.filter((s: any) => s.parentId !== shapeId);

    const p = shape.points;
    const autoSeats: any[] = [];
    const boxSize = 8; 

    const angle = Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x);

    // 2. REGENERATE: Create the new grid based on current row/col values
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const u = cols > 1 ? (c / (cols - 1)) * 0.9 + 0.05 : 0.5;
            const v = rows > 1 ? (r / (rows - 1)) * 0.9 + 0.05 : 0.5;
           

            const gx = (1 - u) * (1 - v) * p[0].x + u * (1 - v) * p[1].x + u * v * p[2].x + (1 - u) * v * p[3].x;
            const gy = (1 - u) * (1 - v) * p[0].y + u * (1 - v) * p[1].y + u * v * p[2].y + (1 - u) * v * p[3].y;

            if (isPointInPoly({ x: gx, y: gy }, p)) {
               const currentGroupId = shape.groupId || null;
                autoSeats.push({
                    id: uuid(),
                    type: "rect",
                    isManual: true,
                    x: gx - boxSize / 2,
                    y: gy - boxSize / 2,
                    width: boxSize,
                    height: boxSize,
                    rotation: (angle * 180) / Math.PI, 
                    fill: "white",
                    stroke: "#333",
                    strokeWidth: 1,
                   parentId: shapeId,
                  groupId: currentGroupId, // Important for the cleanup filter above
                });
            }
        }
    }

    return {
        ...state,
        shapes: [...otherShapes, ...autoSeats], // Merges existing shapes with new dynamic seats
        selectedId: null,
    };
}
case "UPDATE_TABLE_SEATS":
  return {
    ...state,
    shapes: state.shapes.map((s) => {
      if (s.type !== "table" || s.id !== action.payload.id) {
        return s;
      }

      const seats = Math.max(1, action.payload.seats);

      /* ROUND TABLE */
      if (s.kind === "round") {
        return {
          ...s,
          seats,
          radius: Math.max(45, 30 + seats * 4),
        };
      }

      /* HEAD TABLE */
      if (s.kind === "head") {
        return {
          ...s,
          seats,
          width: Math.max(300, seats * 36),
        };
      }

      /* RECT TABLE */
      const seatsPerSide = Math.ceil(seats / 4);
      const size = Math.max(80, seatsPerSide * 36);

      return {
        ...s,
        seats,
        width: size,
        height: size + 40,
      };
    }),
  };
  case "UPDATE_SHAPE_SIZE":
  return {
    ...state,
    shapes: state.shapes.map((s) =>
      s.id === action.payload.id
        ? { ...s, ...action.payload }
        : s
    ),
  };




    /* ---------- UPDATE SEATS ---------- */
    case "UPDATE_SEATS":
  return {
    ...state,
    shapes: state.shapes.map((s) => {
      if (s.type !== "table" || s.id !== action.payload.id) return s;

      const seats = action.payload.seats;

      // 🔹 ROUND TABLE GROW
      if (s.kind === "round") {
        return {
          ...s,
          seats,
          radius: Math.max(45, 45 + (seats - 8) * 4),
        };
      }
      
      

      // 🔹 RECT TABLE GROW
      if (s.kind === "rect") {
        return {
          ...s,
          seats,
          width: Math.max(80, 80 + (seats - 8) * 10),
          height: Math.max(120, 120 + (seats - 8) * 10),
        };
      }

      // 🔹 HEAD TABLE GROW
      if (s.kind === "head") {
        return {
          ...s,
          seats,
          width: Math.max(300, 300 + (seats - 8) * 18),
        };
      }

      return s;
    }),
  };
// case "GENERATE_ROWSEAT": {
//   const { sourceId, rows, columns } = action.payload;

//   const source = state.shapes.find(
//     (s): s is RowSeatShape =>
//       s.type === "rowseat" && s.id === sourceId
//   );

//   if (!source) return state;
//   if (rows <= 0 || columns <= 0) return state;

//   // 🔥 remove old seats of this shape
//   const remaining = state.shapes.filter(
//     (s) =>
//       !(s.type === "rowseat-item" && s.parentId === sourceId)
//   );
//   const MIN_SEAT_SIZE = 20;


// const maxColumns = Math.floor(source.width / MIN_SEAT_SIZE);
// const maxRows = Math.floor(source.height / MIN_SEAT_SIZE);

// const safeColumns = Math.max(1, Math.min(columns, maxColumns));
// const safeRows = Math.max(1, Math.min(rows, maxRows));

// const seatWidth = source.width / safeColumns;
// const seatHeight = source.height / safeRows;

//   const generated: RowSeatItemShape[] = [];

//   let index = 0;

//   for (let row = 0; row < rows; row++) {
//     for (let col = 0; col < columns; col++) {
//       generated.push({
//         id: `${sourceId}-seat-${index++}`,
//         type: "rowseat-item",
//         parentId: sourceId,
//         x: source.x + col * seatWidth,
//         y: source.y + row * seatHeight,
//         width: seatWidth,
//         height: seatHeight,
//       });
//     }
//   }

//   return {
//     ...state,
//     shapes: [...remaining, ...generated],
//     selectedId: sourceId,
//   };
// }


case "UPDATE_ROWSEAT_SIZE":
  return {
    ...state,
    shapes: state.shapes.map((s) =>
      s.type === "rowseat" && s.id === action.payload.id
        ? {
            ...s,
            width: action.payload.width,
            height: action.payload.height,
          }
        : s
    ),
  };




      case "UPDATE_SHAPE_LABEL":
  return {
    ...state,
    shapes: state.shapes.map((s) =>
      (s.type === "table" || s.type === "rect") &&
      s.id === action.payload.id
        ? { ...s, label: action.payload.label }
        : s
    ),
  };

  case "ADD_TEXT":
  return {
    ...state,
    shapes: [...state.shapes, action.payload],
    selectedId: action.payload.id,
  };
  case "DELETE_SHAPE":
    return {

      ...state,
      shapes: state.shapes.filter(
      (s) => s.id !== action.payload.id
    ),
    selectedId : null,
    };

case "UPDATE_TEXT":
  return {
    ...state,
    shapes: state.shapes.map((s) =>
      s.type === "text" && s.id === action.payload.id
        ? { ...s, text: action.payload.text }
        : s
    ),
  };
 case "UPDATE_LABEL":
  return {
    ...state,
    shapes: state.shapes.map((s) =>
      s.id === action.payload.id
        ? { ...s, label: action.payload.label }
        : s
    ),
  };


case "UPDATE_TABLE_LABEL":
  return {
    ...state,
    shapes: state.shapes.map((s) =>
      s.type === "table" && s.id === action.payload.id
        ? { ...s, label: action.payload.label }
        : s
    ),
  };


  




    /* ---------- UPDATE COLOR ---------- */
    case "UPDATE_TABLE_COLOR":
      return {
        ...state,
        shapes: state.shapes.map((s) =>
          s.id === action.payload.id
            ? { ...s, fill: action.payload.fill }
            : s
        ),
      };

      

    /* ---------- SELECT ---------- */
    // case "SELECT_SHAPE":
    //   return {
    //     ...state,
    //     selectedId: action.payload,
    //   };

    /* ---------- RESET ---------- */
    case "RESET_EDITOR":
      return initialState;

    default:
      return state;
  }
}

