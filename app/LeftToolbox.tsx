"use client";

import {
  CursorArrowRaysIcon,
  PencilIcon,
  Square2StackIcon,     // ✅ RECT TOOL (FIXED)
  TableCellsIcon,
  RectangleGroupIcon,
} from "@heroicons/react/24/outline";

import { useDispatch, useSelector } from "react-redux";
import { setTool } from "../store/actions";
import type { RootState } from "../store/store";
import type { ToolType } from "../store/reducer";
import { TbTextSize } from "react-icons/tb"; 
import { PiArmchairLight } from "react-icons/pi";
import { GiRoundTable } from "react-icons/gi";
import { MdTableRestaurant } from "react-icons/md";
import { GiTable } from "react-icons/gi";
import { FaRegSquare } from "react-icons/fa";
import { MdEventSeat } from "react-icons/md";


const tools: { id: ToolType; icon: any; label: string }[] = [
  { id: "select", icon: CursorArrowRaysIcon, label: "Select" },
  { id: "pen", icon: PencilIcon, label: "Pen" },
   { id: "text", icon: TbTextSize ,label: "Rectangle" }, 
  { id: "rect", icon: Square2StackIcon, label: "Rectangle" }, // ✅ FIXED
  { id: "roundTable", icon: GiRoundTable , label: "Round Table" },
  { id: "rectTable", icon: MdTableRestaurant , label: "Rect Table" },
  { id: "headTable", icon: GiTable , label: "Head Table" },
  {id: "seat" , icon:PiArmchairLight, label : "seat" },
 { id: "box", icon: FaRegSquare, label: "Box" },
 { id: "rowseat", icon: MdEventSeat, label: "Row Seat" },

 

  
  
];

export default function ToolPanel() {
  const dispatch = useDispatch();
  const activeTool = useSelector((s: RootState) => s.editor.tool);

  return (
    <div className="w-14 bg-white border-r flex flex-col items-center py-3 gap-3">
      {tools.map(({ id, icon: Icon, label }) => {
        const active = activeTool === id;

        return (
          <button
            key={id}
            onClick={() => dispatch(setTool(id))}
            title={label}
            className={`p-2 rounded-md transition
              ${
                active
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
          >
            <Icon className="w-5 h-5" />
          </button>
        );
      })}
    </div>
  );
}
