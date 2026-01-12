import { configureStore } from "@reduxjs/toolkit";
import { reducer, EditorState } from "./reducer";
import { EditorModel } from "../model/EditorModel";

/* ================= LOAD STATE ================= */
const loadState = (): { editor: EditorState } | undefined => {
  if (typeof window === "undefined") return undefined;

  const raw = localStorage.getItem("editor_state");
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw);
    const model = EditorModel.deserialize(parsed.editor);

    const state = model.serialize();

    // 🔥 SAFETY: ensure penDraft always exists
    if (!state.penDraft) {
      state.penDraft = {
        isDrawing: false,
        points: [],
        tempPoint: null,
      };
    }

    return {
      editor: state,
    };
  } catch {
    return undefined;
  }
};

/* ================= STORE ================= */
export const store = configureStore({
  reducer: {
    editor: reducer,
  },
  preloadedState: loadState(),
});

/* ================= PERSIST ================= */
store.subscribe(() => {
  const model = new EditorModel(store.getState().editor);

  localStorage.setItem(
    "editor_state",
    JSON.stringify({
      editor: model.serialize(),
    })
  );
});

/* ================= TYPES ================= */
export type RootState = ReturnType<typeof store.getState>;
