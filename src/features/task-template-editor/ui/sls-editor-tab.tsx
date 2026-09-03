import type { OnMount } from "@monaco-editor/react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { buildPillarSnippet } from "../lib/pillar-snippet";
import type { TemplateEditorStore } from "../model/template-editor-store";

import { FullTemplateEditor } from "./full-template-editor";

type MonacoEditor = Parameters<OnMount>[0];
type Monaco = Parameters<OnMount>[1];

interface SlsEditorTabProps {
  store: TemplateEditorStore;
}

export const SlsEditorTab = observer(({ store }: SlsEditorTabProps) => {
  const { t } = useTranslation();
  const editorRef = useRef<MonacoEditor | null>(null);
  const [monaco, setMonaco] = useState<Monaco | null>(null);

  const params = store.paramsProperties;

  const handleMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    setMonaco(monacoInstance);
  };

  // Действия пересобираем на каждое изменение списка параметров, иначе в
  // контекстном меню накапливаются пункты для уже удалённых полей
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !monaco) return;

    const actions = params.map((param, index) =>
      editor.addAction({
        id: `saltbox.insert-pillar-param.${param.name}`,
        label: t("task-template-editor.sls-insert-param", { name: param.name }),
        contextMenuGroupId: "saltbox-params",
        contextMenuOrder: index,
        run: (target) => {
          const model = target.getModel();
          const selection = target.getSelection();
          if (!model || !selection) return;

          // Фрагмент должен встать отдельной строкой: переносы добавляем
          // только там, где иначе слиплось бы с соседним кодом
          const lastLine = model.getLineCount();
          const isAtEnd =
            selection.endLineNumber === lastLine &&
            selection.endColumn === model.getLineMaxColumn(lastLine);

          const snippet = buildPillarSnippet(param.name, param.schema);
          const text = `${selection.startColumn > 1 ? "\n" : ""}${snippet}${isAtEnd ? "" : "\n"}`;

          target.executeEdits("saltbox-insert-pillar-param", [{ range: selection, text }]);
          target.focus();
        },
      })
    );

    return () => actions.forEach((action) => action.dispose());
  }, [monaco, params, t]);

  return (
    <FullTemplateEditor value={store.slsRaw} onChange={store.setSlsRaw} onMount={handleMount} />
  );
});
