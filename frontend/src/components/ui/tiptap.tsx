"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import TextAlign from '@tiptap/extension-text-align'
import Highlight from "@tiptap/extension-highlight";
import { TipTapMenu } from "./tiptap-menu";
import { useEffect } from "react";

interface EditorProps {
  value: string
  onChange: (value: string) => void
  editable?: boolean
}

export function TipTapTextEditor({ value, onChange, editable }: EditorProps) {

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: "list-disc ml-3",
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: "list-decimal ml-3",
          },
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight,
    ],
    content: value,
    editable,
    editorProps: {
      attributes: {
        class: editable
          ? "min-h-[156px] py-2 px-3"
          : ""
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })
  
  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (current !== value) {
      editor.commands.setContent(value ?? "")
    }
  }, [value, editor])

  return (
    <div
      className={
        editable
          ? "border rounded-sm"
          : "w-full text-lg"
      }
    >
      {/* Toolbar */}
      { editable && (
        <TipTapMenu
          editor={editor}
        />
      )}

      {/* Editor */}
      <EditorContent
        editor={editor}
      />
    </div>
  )
}