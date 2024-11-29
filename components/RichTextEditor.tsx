"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { Button } from './ui/button';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        // Prevent Enter from submitting the form
        if (event.key === 'Enter' && !event.shiftKey) {
          event.stopPropagation();
          return false;
        }
      },
      attributes: {
        class: 'min-h-[300px] prose dark:prose-invert max-w-none p-4',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="bg-gray-50 dark:bg-gray-800 p-2 border-b border-gray-200 dark:border-gray-700 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''}
        >
          Bold
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''}
        >
          Italic
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={addTable}
        >
          Insert Table
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().addColumnBefore().run()}
        >
          Add Column Before
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().addColumnAfter().run()}
        >
          Add Column After
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().deleteColumn().run()}
        >
          Delete Column
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().addRowBefore().run()}
        >
          Add Row Before
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().addRowAfter().run()}
        >
          Add Row After
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().deleteRow().run()}
        >
          Delete Row
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => editor.chain().focus().deleteTable().run()}
        >
          Delete Table
        </Button>
      </div>
      <EditorContent 
        editor={editor} 
        className="prose dark:prose-invert max-w-none p-4 min-h-[200px]"
      />
    </div>
  );
} 