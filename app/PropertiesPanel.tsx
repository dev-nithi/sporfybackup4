"use client";

import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../store/store";
import {
  updateTableColor,
  updateTableSeats,
  updateTableLabel,
  deleteShape,
  updatePenStroke,
  updateLabel,
} from "../store/actions";
import { useState } from "react";

export default function PropertiesPanel() {
  const dispatch = useDispatch();
  const [rows, setRows] = useState(5);
  const [columns, setColumns] = useState(10);

  const selectedShape = useSelector((state: RootState) =>
    state.editor.shapes.find((s) => s.id === state.editor.selectedId)
  );

  const tool = useSelector((state: RootState) => state.editor.tool);

  if (!selectedShape) {
    return <div className="w-72 p-4 text-gray-400">No selection</div>;
  }

  const isTable = selectedShape.type === "table";
  const isPen = selectedShape.type === "pen";

  return (
    <div className="w-72 bg-white border-l p-4 space-y-5 h-full overflow-y-auto">
      {/* ---------- NAME ---------- */}
      {"label" in selectedShape && (
        <div>
          <label className="text-sm text-gray-500 font-bold uppercase">Name</label>
          <input
            type="text"
            value={(selectedShape as any).label}
            onChange={(e) => {
              if (selectedShape.type === "table") {
                dispatch(updateTableLabel(selectedShape.id, e.target.value));
              } else if (selectedShape.type === "rect") {
                dispatch(updateLabel(selectedShape.id, e.target.value));
              }
            }}
            className="w-full mt-1 px-2 py-1 border rounded"
          />
        </div>
      )}

      {/* ---------- NEAT ROW ARRANGEMENT ---------- */}
      {(isPen && tool === "rowseat") && (
        <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <h4 className="text-xs font-bold text-blue-700 uppercase">Seating Grid</h4>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-gray-500">Rows</label>
              <input
                type="number"
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                className="w-full px-2 py-1 border rounded text-sm bg-white text-black"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-gray-500">Max Cols</label>
              <input
                type="number"
                value={columns}
                onChange={(e) => setColumns(Number(e.target.value))}
                className="w-full px-2 py-1 border rounded text-sm bg-white text-black"
              />
            </div>
          </div>

          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold text-sm transition-all"
            onClick={() =>
              dispatch({
                type: "GENERATE_SEATS_IN_SHAPE",
                payload: {
                  shapeId: selectedShape.id,
                  rows: Number(rows),
                  cols: Number(columns),
                },
              })
            }
          >
            Generate Neat Arrangement
          </button>
          <p className="text-[10px] text-gray-400 italic">
            *Seats will be automatically reduced in narrow parts of the shape.
          </p>
        </div>
      )}
{selectedShape?.type === "pen" && (
  <button
    onClick={() => dispatch({ 
      type: "GROUP_SHAPE_AND_SEATS", 
      payload: { shapeId: selectedShape.id } 
    })}
    style={{
      backgroundColor: "black",
      color: "white",
      padding: "12px",  
      width: "100%",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontWeight: "bold",
      marginTop: "10px"
    }}
  >
    GROUP SHAPE & SEATS
  </button>
)}

      {/* ---------- TABLE SEATS ---------- */}
      {isTable && (
        <div>
          <label className="text-sm text-gray-500 font-bold uppercase">Seats</label>
          <div className="flex items-center gap-3 mt-2">
            <button
              className="w-8 h-8 border rounded hover:bg-gray-100"
              onClick={() => dispatch(updateTableSeats(selectedShape.id, Math.max(1, (selectedShape as any).seats - 1)))}
            > − </button>
            <span className="font-bold">{(selectedShape as any).seats}</span>
            <button
              className="w-8 h-8 border rounded hover:bg-gray-100"
              onClick={() => dispatch(updateTableSeats(selectedShape.id, (selectedShape as any).seats + 1))}
            > + </button>
          </div>
        </div>
      )}

      {/* ---------- PEN BORDER ---------- */}
      {isPen && (
        <div>
          <label className="block text-sm font-bold text-gray-500 uppercase">Border Weight</label>
          <input
            type="range"
            min={1} max={10}
            value={(selectedShape as any).strokeWidth || 2}
            onChange={(e) => dispatch(updatePenStroke(selectedShape.id, Number(e.target.value)))}
            className="w-full mt-2 cursor-pointer"
          />
        </div>
      )}

      {/* ---------- DELETE ---------- */}
      <button
        onClick={() => dispatch(deleteShape(selectedShape.id))}
        className="w-full mt-6 bg-red-500 hover:bg-red-600 text-white py-2 rounded font-bold transition-colors shadow-sm"
      >
        Delete
      </button>
    </div>
  );
}