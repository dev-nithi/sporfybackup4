"use client";

import {
  Stage,
  Layer,
  Circle,
  Rect,
  Line,
  Group,
  Text,
  Path,
} from "react-konva";
import {useEffect} from "react";
import { useDispatch, useSelector, } from "react-redux";
import {
  addShape,
  moveShape,
  selectShape,
  updateLabel,
  updateTableLabel,
  addText,
  resetEditor,
  setTool,
  updateShapeSize,
  deleteShape
} from "../store/actions";
import type { RootState } from "../store/store";
import { v4 as uuid } from "uuid";
import { useRef, useState } from "react";
import type { PenPoint } from "../store/reducer"



/* ================= CHAIR ICON ================= */
const CHAIR_PATH =
  "M6 10 Q6 4 12 4 H36 Q42 4 42 10 V20 Q42 26 36 26 H32 V18 H16 V26 H12 Q6 26 6 20 ZM10 26 V40 H16 V32 H32 V40 H38 V26";

/* ================= AUTO SEAT LOGIC ================= */


const SEAT_GAP = 36;
const SEAT_OFFSET = 40;
const HANDLE_SIZE = 8;

const CANVAS_WIDTH = 1350;
const CANVAS_HEIGHT = 900;


function isNear(
  a: { x: number; y: number },
  b: { x: number; y: number },
  threshold = 10
) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy) <= threshold;
}




function buildPath(
  points: { x: number; y: number }[],
  temp: { x: number; y: number } | null
) {
  if (!points.length) return "";

  let d = `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }

  // preview segment
  if (temp) {
    d += ` L ${temp.x} ${temp.y}`;
  }

  return d;
}





function getSeats(table: any) {
  /* ================= ROUND TABLE ================= */
  if (table.kind === "round") {
    const radius = Math.max(
      table.radius,
      30 + table.seats * 4 // 🔥 AUTO EXPAND
    );

    const angle = (2 * Math.PI) / table.seats;

    return Array.from({ length: table.seats }).map((_, i) => ({
      x: Math.cos(i * angle) * (radius + SEAT_OFFSET),
      y: Math.sin(i * angle) * (radius + SEAT_OFFSET),
    }));
  }

  /* ================= HEAD TABLE ================= */
  if (table.kind === "head") {
    const width = Math.max(
      table.width,
      table.seats * SEAT_GAP
    );

    const gap = width / (table.seats + 1);

    return Array.from({ length: table.seats }).map((_, i) => ({
      x: -width / 2 + gap * (i + 1),
      y: table.height / 2 + SEAT_OFFSET,
    }));
  }

  /* ================= RECT TABLE ================= */
  const seatsPerSide = Math.ceil(table.seats / 4);

  const width = Math.max(
    table.width,
    seatsPerSide * SEAT_GAP
  );

  const height = Math.max(
    table.height,
    seatsPerSide * SEAT_GAP
  );

  const pos: { x: number; y: number }[] = [];

  // TOP
  for (let i = 0; i < seatsPerSide; i++)
    pos.push({
      x: -width / 2 + SEAT_GAP * (i + 1),
      y: -height / 2 - SEAT_OFFSET,
    });

  // RIGHT
  for (let i = 0; i < seatsPerSide; i++)
    pos.push({
      x: width / 2 + SEAT_OFFSET,
      y: -height / 2 + SEAT_GAP * (i + 1),
    });

  // BOTTOM
  for (let i = 0; i < seatsPerSide; i++)
    pos.push({
      x: -width / 2 + SEAT_GAP * (i + 1),
      y: height / 2 + SEAT_OFFSET,
    });

  // LEFT
  for (let i = 0; i < seatsPerSide; i++)
    pos.push({
      x: -width / 2 - SEAT_OFFSET,
      y: -height / 2 + SEAT_GAP * (i + 1),
    });

  return pos.slice(0, table.seats);
}


/* ================= COMPONENT ================= */
export default function CanvasPanel() {
  const dispatch = useDispatch();

  const shapes = useSelector((s: RootState) => s.editor.shapes);
  const tool = useSelector((s: RootState) => s.editor.tool);
  const selectedId = useSelector((s: RootState) => s.editor.selectedId);
const penDraft = useSelector((s: RootState) => s.editor.penDraft);
const editingPenId = useSelector(
  (s: RootState) => s.editor.editingPenId
);





 

  const [lines, setLines] = useState<{ points: number[] }[]>([]);
  const [rectPreview, setRectPreview] = useState<any>(null);
  const drawing = useRef(false);
  const isResizingRef = useRef(false);

  const resizeRef = useRef<{
  w: number;
  h: number;
  x: number;
  y: number;
} | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!penDraft.isDrawing) return;

      if (e.key === "Enter") {
        dispatch({
          type: "PEN_FINISH",
          payload: { id: uuid() },
        });
        dispatch(setTool("select"));
      }

      if (e.key === "Escape") {
        dispatch({ type: "PEN_CANCEL" });
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [penDraft.isDrawing, dispatch]);


  return (
    <div className="relative w-full h-full">
      <Stage
        width={1350}
        height={900}
        className="bg-gray-100 rounded-md"
       onDblClick={(e) => {
  if (tool !== "pen" || !penDraft.isDrawing) return;

  e.evt.preventDefault();
  e.evt.stopPropagation();

  // 🔥 DO NOT READ POSITION HERE
  dispatch({
    type: "PEN_FINISH",
    payload: { id: uuid() },
  });
}}

        

      onMouseDown={(e) => {
  const stage = e.target.getStage();
  if (!stage) return;

  // 🔥 BLOCK SECOND CLICK OF DOUBLE CLICK
  if (e.evt.detail > 1) return;

  const pos = stage.getPointerPosition();
  if (!pos) return;
  /* ===============================
   🔥 SEAT ZONE TOOL
// =============================== */
// 🔥 ADD THIS BLOCK ONLY
if (tool === "rowseat") {
  dispatch({
    type: "ADD_SHAPE",
    payload: {
      id: uuid(),
      type: "rowseat",
      // x: CANVAS_WIDTH / 2 - 20,
      // y: CANVAS_HEIGHT / 2 - 20,
      width: 20,
      height: 20,
    },
  });

  dispatch(setTool("select"));
  return;
}




if (tool === "seatZone") {
 dispatch(
    addShape({
      id: uuid(),
      type: "rect",
      x: pos.x,
      y: pos.y,
      width: 60,
      height: 60,
      label: "Box",
    })
  );

  dispatch(setTool("select")); // 🔴 IMPORTANT (avoid repeat add)
  return;
}
if (tool === "box") {
  dispatch({
    type: "ADD_SHAPE",
    payload: {
      id: uuid(),
      type: "box",
      x: pos.x,
      y: pos.y,
      width: 80,
      height: 80,
    },
  });

  dispatch(setTool("select"));
  return;
}




  /* ================= 🖊️ PEN TOOL ================= */
  if (tool === "pen" && !editingPenId) {
  const points = penDraft.points;
  const first = points[0];
  const last = points[points.length - 1];

  // 🔹 START
  if (!penDraft.isDrawing) {
    dispatch({
      type: "PEN_START",
      payload: pos,
    });
    return;
  }

  // 🔹 CLOSE PATH (click near first point)
  if (points.length > 2 && first && isNear(first, pos)) {
    // snap last point to first
    if (!isNear(last, first)) {
      dispatch({
        type: "PEN_ADD_POINT",
        payload: { x: first.x, y: first.y },
      });
    }

    dispatch({
      type: "PEN_FINISH",
      payload: { id: uuid(), closed: true },
    });
    return;
  }

  // 🔹 NORMAL ADD POINT
  dispatch({
    type: "PEN_ADD_POINT",
    payload: pos,
  });
  return;
}

  // if (tool === "pen" &&  !editingPenId) {
  //   const existing = findNearbyPoint(
  //     penDraft.points,
  //     pos
  //   );

  //   // 🔹 FIRST CLICK → START
  //   if (!penDraft.isDrawing) {
  //     dispatch({
  //       type: "PEN_START",
  //       payload: existing ?? pos,
  //     });
  //   } 
  //   // 🔹 DRAWING
  //   else {
  //     // 🔥 CLICK ON EXISTING ENDPOINT → FINISH (NO NEW POINT)
  //     if (existing) {
  //       dispatch({
  //         type: "PEN_FINISH",
  //         payload: { id: uuid() },
  //       });
  //       dispatch({
  //   type: "PEN_ADD_POINT",
  //   payload: { x: existing.x, y: existing.y },
  // });
  //     } 
  //     // 🔹 NORMAL CLICK → ADD NEW ANCHOR
  //     else {
  //       dispatch({
  //         type: "PEN_ADD_POINT",
  //         payload: pos,
  //       });
  //     }
  //   }
  //   return;
  // }

  /* ================= RECT ================= */
  if (tool === "rect") {
    setRectPreview({ x: pos.x, y: pos.y, w: 0, h: 0 });
    return;
  }

  /* ================= MANUAL SEAT ================= */
  if (tool === "seat") {
    dispatch(
      addShape({
        id: uuid(),
        type: "chair",
        x: pos.x,
        y: pos.y,
        fill: "#000",
        isManual: true,
      })
    );
    dispatch(setTool("select"));
    return;
  }

  /* ================= ROUND TABLE ================= */
  if (tool === "roundTable") {
    dispatch(
      addShape({
        id: uuid(),
        type: "table",
        kind: "round",
        x: pos.x,
        y: pos.y,
        radius: 45,
        seats: 8,
        fill: "#e5e7eb",
        label: "Table",
      })
    );
    dispatch(setTool("select"));
    return;
  }

  /* ================= RECT TABLE ================= */
  if (tool === "rectTable") {
    dispatch(
      addShape({
        id: uuid(),
        type: "table",
        kind: "rect",
        x: pos.x,
        y: pos.y,
        width: 80,
        height: 120,
        seats: 8,
        fill: "#e5e7eb",
        label: "Table",
      })
    );
    dispatch(setTool("select"));
    return;
  }

  /* ================= HEAD TABLE ================= */
  if (tool === "headTable") {
    dispatch(
      addShape({
        id: uuid(),
        type: "table",
        kind: "head",
        x: pos.x,
        y: pos.y,
        width: 300,
        height: 40,
        seats: 10,
        fill: "#e5e7eb",
        label: "Head Table",
      })
    );
    dispatch(setTool("select"));
    return;
  }

  /* ================= TEXT ================= */
  if (tool === "text") {
    dispatch(
      addText({
        id: uuid(),
        type: "text",
        x: pos.x,
        y: pos.y,
        width: 140,
        height: 30,
        text: "Text",
      })
    );
    dispatch(setTool("select"));
    return;
  }
}}


       onMouseMove={(e) => {
  const stage = e.target.getStage();
  if (!stage) return;

  const pos = stage.getPointerPosition();
  if (!pos) return;

  /* ================= 🖊️ PEN TOOL ================= */
  if (tool === "pen" && penDraft.isDrawing) {
    dispatch({
      type: "PEN_UPDATE_TEMP",
      payload: { x: pos.x, y: pos.y },
    });
    return; // ❌ stop other tools
  }

  /* ================= RECT PREVIEW ================= */
  if (tool === "rect" && rectPreview) {
    setRectPreview({
      ...rectPreview,
      w: pos.x - rectPreview.x,
      h: pos.y - rectPreview.y,
    });
    return;
  }
}}


        onMouseUp={() => {



          if (tool === "rect" && rectPreview) {
            dispatch(
              addShape({
                id: uuid(),
                type: "rect",
                x: rectPreview.x,
                y: rectPreview.y,
                width: rectPreview.w,
                height: rectPreview.h,
                label: "rectangle",
              })
            );
            setRectPreview(null);
            dispatch(setTool("select"));
          }
        }}
      >
        <Layer>


        {/* 🔥 RESIZE HANDLES */}





           {/* 🖊️ Draft Pen Preview */}
    {penDraft.isDrawing && (
      <Path
        data={buildPath(penDraft.points, penDraft.tempPoint)}
      stroke="#000"
      strokeWidth={2}
      fill="transparent"
      lineCap="round"
      />
    )}


    
    {/* 🟦 ANCHOR POINTS (SQUARES) */}
  {penDraft.points.map((p, i) => (
    <Rect
      key={i}
      x={p.x - 4}
      y={p.y - 4}
      width={8}
      height={8}
      fill="white"
      stroke="black"
      strokeWidth={1}
    />
  ))}

    {/* 🖊️ Saved Pen Shapes */}
   {shapes.filter(s => s.type === "pen").map((p: any) => {
  const isSelected = selectedId === p.id;

  

  return (
    <Group
      key={p.id}
      x={p.x}
      y={p.y}
      draggable={isSelected}
      onMouseDown={(e) => {
        e.cancelBubble = true;
        dispatch(selectShape(p.id));
      }}
    >
      <Path
        data={buildPath(p.points, null)}
        stroke={p.stroke}
        strokeWidth={p.strokeWidth}
        fill="transparent"
      />

      {/* 🔥 SHOW ENDPOINTS ONLY WHEN SELECTED */}
     {isSelected &&
  p.points.map((pt: any, i: number) => (
    <Rect
      key={i}
      x={pt.x - 4}
      y={pt.y - 4}
      width={8}
      height={8}
      fill="white"
      stroke="black"
      onMouseDown={(e) => {
        e.cancelBubble = true;

        dispatch({
          type: "PEN_EDIT_START",
          payload: {
            penId: p.id,
            pointIndex: i, // 🔥 ANY POINT
          },
        });
      }}
    />
  ))}



    </Group>
  );
})}



          {/* SAVED PENS */}
       
          {/* {lines.map((line, i) => (
  <Line
    key={i}
    points={line.points}
    stroke="#000"
    strokeWidth={2}
    tension={0.4}      // 🔥 smooth pen effect
    lineCap="round"    // 🔥 pen tip
    lineJoin="round"   // 🔥 smooth joins
  />
))} */}

          {rectPreview && (
            <Rect
              x={rectPreview.x}
              y={rectPreview.y}
              width={rectPreview.w}
              height={rectPreview.h}
              stroke="#2563eb"
              dash={[6, 4]}
            />
          )}

          {shapes.map((s: any) => {
            if (s.type === "text") return <Text key={s.id} {...s} />;


            if (s.type === "rowseat") {
  return (
    <Group
      key={s.id}
      x={s.x}
      y={s.y}
      draggable={selectedId === s.id}
      onMouseDown={(e) => {
        e.cancelBubble = true;
        dispatch(selectShape(s.id));
      }}
      onDragEnd={(e) =>
        dispatch(moveShape(s.id, e.target.x(), e.target.y()))
      }
    >
      <Rect
        width={s.width}
        height={s.height}
        fill="#fef3c7"
        stroke={selectedId === s.id ? "#2563eb" : "#92400e"}
        strokeWidth={2}
      />
    </Group>
  );
}



            /* ===============================
   🔥 SEAT ZONE RENDER
=============================== */
// 🔥 ADD THIS BLOCK
{/* 🔥 RESIZE HANDLES */}
if (s.type === "box") {
  const HANDLE = 8;

  return (
    <Group
      key={s.id}
      x={s.x}
      y={s.y}
      draggable={selectedId === s.id && !isResizingRef.current}
      onMouseDown={(e) => {
        e.cancelBubble = true;
        dispatch(selectShape(s.id));
      }}
      onDragEnd={(e) =>
        dispatch(moveShape(s.id, e.target.x(), e.target.y()))
      }
    >
      {/* BOX */}
      <Rect
        width={s.width}
        height={s.height}
        fill="#f9fafb"
        stroke={selectedId === s.id ? "#2563eb" : "#111"}
        strokeWidth={2}
      />

      {/* 🔥 RESIZE HANDLES */}
      {selectedId === s.id && (
        <>
          {/* ---------- TOP LEFT ---------- */}
          <Rect
            x={-HANDLE / 2}
            y={-HANDLE / 2}
            width={HANDLE}
            height={HANDLE}
            fill="white"
            stroke="black"
            draggable
            onMouseDown={(e) => (e.cancelBubble = true)}
            onDragStart={(e) => {
              e.cancelBubble = true;
              isResizingRef.current = true;
              resizeRef.current = {
                w: s.width,
                h: s.height,
                x: s.x,
                y: s.y,
              };
            }}
            onDragMove={(e) => {
              e.cancelBubble = true;
              if (!resizeRef.current) return;

              const dx = e.target.x() + HANDLE / 2;
              const dy = e.target.y() + HANDLE / 2;

              dispatch({
                type: "UPDATE_SHAPE_SIZE",
                payload: {
                  id: s.id,
                  x: resizeRef.current.x + dx,
                  y: resizeRef.current.y + dy,
                  width: Math.max(20, resizeRef.current.w - dx),
                  height: Math.max(20, resizeRef.current.h - dy),
                },
              });

              // 🔥 lock handle position
              e.target.position({ x: -HANDLE / 2, y: -HANDLE / 2 });
            }}
            onDragEnd={(e) => {
              e.cancelBubble = true;
              isResizingRef.current = false;
              resizeRef.current = null;
            }}
          />

          {/* ---------- TOP RIGHT ---------- */}
          <Rect
            x={s.width - HANDLE / 2}
            y={-HANDLE / 2}
            width={HANDLE}
            height={HANDLE}
            fill="white"
            stroke="black"
            draggable
            onMouseDown={(e) => (e.cancelBubble = true)}
            onDragStart={(e) => {
              e.cancelBubble = true;
              isResizingRef.current = true;
              resizeRef.current = {
                w: s.width,
                h: s.height,
                x: s.x,
                y: s.y,
              };
            }}
            onDragMove={(e) => {
              e.cancelBubble = true;
              if (!resizeRef.current) return;

              const dx = e.target.x() - (s.width - HANDLE / 2);
              const dy = e.target.y() + HANDLE / 2;

              dispatch({
                type: "UPDATE_SHAPE_SIZE",
                payload: {
                  id: s.id,
                  y: resizeRef.current.y + dy,
                  width: Math.max(20, resizeRef.current.w + dx),
                  height: Math.max(20, resizeRef.current.h - dy),
                },
              });

              e.target.position({
                x: s.width - HANDLE / 2,
                y: -HANDLE / 2,
              });
            }}
            onDragEnd={(e) => {
              e.cancelBubble = true;
              isResizingRef.current = false;
              resizeRef.current = null;
            }}
          />

          {/* ---------- BOTTOM LEFT ---------- */}
          <Rect
            x={-HANDLE / 2}
            y={s.height - HANDLE / 2}
            width={HANDLE}
            height={HANDLE}
            fill="white"
            stroke="black"
            draggable
            onMouseDown={(e) => (e.cancelBubble = true)}
            onDragStart={(e) => {
              e.cancelBubble = true;
              isResizingRef.current = true;
              resizeRef.current = {
                w: s.width,
                h: s.height,
                x: s.x,
                y: s.y,
              };
            }}
            onDragMove={(e) => {
              e.cancelBubble = true;
              if (!resizeRef.current) return;

              const dx = e.target.x() + HANDLE / 2;
              const dy = e.target.y() - (s.height - HANDLE / 2);

              dispatch({
                type: "UPDATE_SHAPE_SIZE",
                payload: {
                  id: s.id,
                  x: resizeRef.current.x + dx,
                  width: Math.max(20, resizeRef.current.w - dx),
                  height: Math.max(20, resizeRef.current.h + dy),
                },
              });

              e.target.position({
                x: -HANDLE / 2,
                y: s.height - HANDLE / 2,
              });
            }}
            onDragEnd={(e) => {
              e.cancelBubble = true;
              isResizingRef.current = false;
              resizeRef.current = null;
            }}
          />

          {/* ---------- BOTTOM RIGHT ---------- */}
          <Rect
            x={s.width - HANDLE / 2}
            y={s.height - HANDLE / 2}
            width={HANDLE}
            height={HANDLE}
            fill="white"
            stroke="black"
            draggable
            onMouseDown={(e) => (e.cancelBubble = true)}
            onDragStart={(e) => {
              e.cancelBubble = true;
              isResizingRef.current = true;
              resizeRef.current = {
                w: s.width,
                h: s.height,
                x: s.x,
                y: s.y,
              };
            }}
            onDragMove={(e) => {
              e.cancelBubble = true;
              if (!resizeRef.current) return;

              const dx = e.target.x() - (s.width - HANDLE / 2);
              const dy = e.target.y() - (s.height - HANDLE / 2);

              dispatch({
                type: "UPDATE_SHAPE_SIZE",
                payload: {
                  id: s.id,
                  width: Math.max(20, resizeRef.current.w + dx),
                  height: Math.max(20, resizeRef.current.h + dy),
                },
              });

              e.target.position({
                x: s.width - HANDLE / 2,
                y: s.height - HANDLE / 2,
              });
            }}
            onDragEnd={(e) => {
              e.cancelBubble = true;
              isResizingRef.current = false;
              resizeRef.current = null;
            }}
          />
        </>
      )}
    </Group>
  );
}







            {/* ACTIVE PEN */}

{/* SAVED PEN SHAPES */}


            /* ================= MANUAL SEAT ================= */
if (s.type === "chair" && s.isManual) {
  return (
    <Path
      key={s.id}
      x={s.x}
      y={s.y}
      data={CHAIR_PATH}
      scaleX={0.8}
      scaleY={0.8}
      offsetX={24}
      offsetY={24}
      fill="white"
      stroke={selectedId === s.id ? "#2563eb" : "#000"}
      strokeWidth={3}
      draggable
      hitStrokeWidth={20}

      onMouseDown={(e) => {
        e.cancelBubble = true; // 🔥 prevents table drag
        dispatch(selectShape(s.id));
      }}

      onDragEnd={(e) =>
        dispatch(moveShape(s.id, e.target.x(), e.target.y()))
      }
    />
  );
}

            
            

           if (s.type === "rect") {
  return (
    <Group
      key={s.id}
      x={s.x}
      y={s.y}
      draggable
      listening={true}

      // ✅ SELECT RECTANGLE
      onMouseDown={(e) => {
        e.cancelBubble = true;   // 🔥 VERY IMPORTANT
        dispatch(selectShape(s.id));
      }}  
      onDragEnd={(e) =>
        dispatch(
          moveShape(
            s.id,
            e.target.x(),
            e.target.y()
          )
        )
      }
    >
      <Rect
        width={s.width}
        height={s.height}
        fill="#f9fafb"
        stroke={selectedId === s.id ? "#2563eb" : "#111"}
        strokeWidth={2}

        // ✅ CLICKABLE AREA FIX
        hitStrokeWidth={20}
      />

      <Text
        text={s.label}
        width={s.width}
        height={s.height}
        align="center"
        verticalAlign="middle"
        listening={false} // 🔥 text should not block clicks
      />
    </Group>
  );
}


            return (
              <Group
                key={s.id}
  x={s.x}
  y={s.y}
  draggable={selectedId === s.id} // 🔥 ONLY table draggable when selected
  onMouseDown={(e) => {
    e.cancelBubble = true;
    dispatch(selectShape(s.id));
  }}
  onDragEnd={(e) => {
    dispatch(moveShape(s.id, e.target.x(), e.target.y()));
  }}
>
                {s.kind === "round" ? (
                  <Circle
                    radius={s.radius}
                    fill={s.fill}
                    stroke={
                      selectedId === s.id ? "#2563eb" : "#333"
                    }
                      onDragEnd={(e) =>
    dispatch(
      moveShape(
        s.id,
        e.target.x(),
        e.target.y()
      )
    )}
                    strokeWidth={4}
                  />
                ) : (
                  <Rect
                    x={-s.width / 2}
  y={-s.height / 2}
  width={s.width}
  height={s.height}
  fill={s.fill}
  stroke={selectedId === s.id ? "#2563eb" : "#333"}
  
                      onDragEnd={(e) =>
    dispatch(
      moveShape(
        s.id,
        e.target.x(),
        e.target.y()
      )
    )}
                    strokeWidth={4}
                  />
                )}

                <Text text={s.label} offsetX={20} offsetY={6} />
                {getSeats(s).map((p, i) => {
  const seatId = `${s.id}-seat-${i}`;

  return (
    <Path
      key={seatId}
      x={p.x}
      y={p.y}
      data={CHAIR_PATH}
      scaleX={0.8}
      scaleY={0.8}
      offsetX={24}
      offsetY={24}
      fill="white"
      stroke={selectedId === seatId ? "#2563eb" : "#000"}
      strokeWidth={3}
      draggable
      hitStrokeWidth={20}


      /* ✅ THIS MAKES AUTO SEATS WORK */
      onMouseDown={(e) => {
        e.cancelBubble = true;     // ❌ stop table selection
        dispatch(selectShape(seatId));
      }}

      onDragStart={(e) => {
        e.cancelBubble = true;     // ❌ stop table drag
      }}

      onDragEnd={(e) => {
        e.cancelBubble = true;     // ❌ still block bubbling
        // visual-only move (no redux)
      }}
    />
  );
})}



              </Group>
            );
          })}
        </Layer>
      </Stage>

      <button
        onClick={() => dispatch(resetEditor())}
        className="absolute bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded"
      >
        Clear Canvas
      </button>
    </div>
  );
}  