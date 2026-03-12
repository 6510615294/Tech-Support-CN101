"use client"

import Editor from "@monaco-editor/react"

type CodeEditorProps = {
  value: string
  className?: string
  language?: string
  theme?: string
  readOnly?: boolean
  fontSize?: number
  onChange?: (value: string) => void
}

export default function CodeEditor({
  value,
  className,
  language = "python",
  theme = "vs-dark",
  readOnly = true,
  fontSize = 14,
  onChange,
}:
  CodeEditorProps
) {
  return (
    <div className={`h-full w-full overflow-hidden ${className}`}>
      <Editor
        height="100%"
        defaultLanguage={language}
        value={value}
        theme={theme}
        onChange={(val) => onChange?.(val || "")}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize,
          automaticLayout: true,
          tabSize: 4,
          wordWrap: "on",
        }}
      />
    </div>
  )
}