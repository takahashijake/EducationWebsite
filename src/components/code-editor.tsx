"use client";
import { useEffect, useRef, useState } from "react";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  bracketMatching,
  defaultHighlightStyle,
  indentOnInput,
  syntaxHighlighting,
} from "@codemirror/language";
import { cpp } from "@codemirror/lang-cpp";
import { SOURCE_LIMIT } from "@/lib/execution/types";

export function CodeEditor({
  value,
  onChange,
  onRun,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  label: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const editor = useRef<EditorView>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const callbacks = useRef({ onChange, onRun });
  useEffect(() => {
    callbacks.current = { onChange, onRun };
  }, [onChange, onRun]);
  useEffect(() => {
    let view: EditorView;
    try {
      view = new EditorView({
        parent: host.current!,
        state: EditorState.create({
          doc: value,
          extensions: [
            lineNumbers(),
            highlightActiveLine(),
            highlightActiveLineGutter(),
            history(),
            indentOnInput(),
            bracketMatching(),
            syntaxHighlighting(defaultHighlightStyle),
            cpp(),
            EditorState.changeFilter.of(
              (transaction) => transaction.newDoc.length <= SOURCE_LIMIT,
            ),
            keymap.of([
              {
                key: "Mod-Enter",
                run: () => {
                  callbacks.current.onRun();
                  return true;
                },
              },
              ...defaultKeymap,
              ...historyKeymap,
            ]),
            EditorView.contentAttributes.of({
              "aria-label": label,
              "aria-multiline": "true",
              role: "textbox",
              spellcheck: "false",
            }),
            EditorView.updateListener.of((update) => {
              if (update.docChanged)
                callbacks.current.onChange(update.state.doc.toString());
            }),
          ],
        }),
      });
    } catch {
      // CodeMirror initialization is an external DOM operation; expose a usable fallback if it fails.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFailed(true);
      return;
    }
    editor.current = view;
    // The editor is mounted imperatively, so the loading message follows that mount.
    setReady(true);
    return () => {
      view.destroy();
      editor.current = null;
    };
    // Initial document only; later external changes retain the editor instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [label]);
  useEffect(() => {
    const view = editor.current;
    if (view && view.state.doc.toString() !== value)
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
      });
  }, [value]);
  return (
    <>
      <div className="code-editor" ref={host} />
      {!ready && !failed && (
        <p role="status">
          Loading editable C++ code editor… If this message remains, enable
          JavaScript, reload, and check failed page resources in the browser
          Network panel.
        </p>
      )}
      {failed && (
        <div role="alert">
          <p>
            The enhanced editor could not load. Use the plain editor below, or
            reload this page to retry.
          </p>
          <textarea
            aria-label={label}
            className="code-editor plain-code-editor"
            spellCheck={false}
            value={value}
            maxLength={SOURCE_LIMIT}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                onRun();
              }
            }}
          />
        </div>
      )}
    </>
  );
}
