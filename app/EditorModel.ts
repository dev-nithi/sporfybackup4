import { EditorState } from "../store/reducer";

export class EditorModel {
  state: EditorState;

  constructor(state?: EditorState) {
    this.state = state ?? {
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
    
  }

  serialize(): EditorState {
    return this.state;
  }

  static deserialize(raw: any): EditorModel {
    if (!raw) return new EditorModel();
    return new EditorModel(raw as EditorState);
  }
}
