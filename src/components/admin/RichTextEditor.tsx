'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { createLowlight } from 'lowlight';
import js from 'highlight.js/lib/languages/javascript';
import ts from 'highlight.js/lib/languages/typescript';
import bash from 'highlight.js/lib/languages/bash';
import { useEffect, useCallback, useRef, useState } from 'react';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Quote, Code, Code2,
    Image as ImageIcon, Link as LinkIcon, Link2Off,
    Table as TableIcon, Undo2, Redo2,
    Heading1, Heading2, Heading3, Minus,
    Loader2
} from 'lucide-react';

const lowlight = createLowlight();
lowlight.register({ js, ts, bash });

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: number;
}

function ToolbarButton({
    onClick,
    active,
    title,
    children,
    disabled,
}: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            onMouseDown={(e) => {
                e.preventDefault();
                onClick();
            }}
            title={title}
            disabled={disabled}
            className={`
                p-1.5 rounded-lg transition-all duration-150 shrink-0
                ${active
                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white'
                }
                ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
            `}
        >
            {children}
        </button>
    );
}

function Divider() {
    return <span className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-0.5 shrink-0" />;
}

export function RichTextEditor({ value, onChange, placeholder = 'Start writing...', minHeight = 400 }: RichTextEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false,
            }),
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Image.configure({ HTMLAttributes: { class: 'rounded-xl max-w-full h-auto my-4 mx-auto block' } }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: 'text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 transition-colors' },
            }),
            Placeholder.configure({ placeholder }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            CodeBlockLowlight.configure({
                lowlight,
                HTMLAttributes: { class: 'not-prose rounded-xl overflow-hidden' },
            }),
        ],
        content: value,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert prose-slate max-w-none focus:outline-none px-6 py-5 leading-relaxed',
            },
        },
    });

    // Sync external value changes (e.g., when loading from DB)
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    const addImage = useCallback(() => {
        const choice = window.confirm('Click OK to upload from your PC, or Cancel to provide a URL.');
        if (choice) {
            fileInputRef.current?.click();
        } else {
            const url = window.prompt('Image URL:');
            if (url && editor) {
                editor.chain().focus().setImage({ src: url }).run();
            }
        }
    }, [editor]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editor) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (data.url) {
                editor.chain().focus().setImage({ src: data.url }).run();
            } else {
                alert(data.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Image upload failed:', error);
            alert('Upload failed');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const setLink = useCallback(() => {
        const previousUrl = editor?.getAttributes('link').href;
        const url = window.prompt('URL:', previousUrl || 'https://');
        if (url === null) return;
        if (url === '') {
            editor?.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor?.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
    }, [editor]);

    const insertTable = useCallback(() => {
        editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }, [editor]);

    if (!editor) return null;

    return (
        <div className="w-full rounded-xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-slate-800/40 sticky top-0 z-10">
                {/* History */}
                <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo (Ctrl+Z)" disabled={!editor.can().undo()}>
                    <Undo2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo (Ctrl+Y)" disabled={!editor.can().redo()}>
                    <Redo2 className="h-4 w-4" />
                </ToolbarButton>

                <Divider />

                {/* Headings */}
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
                    <Heading1 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
                    <Heading2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
                    <Heading3 className="h-4 w-4" />
                </ToolbarButton>

                <Divider />

                {/* Text formatting */}
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold (Ctrl+B)">
                    <Bold className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic (Ctrl+I)">
                    <Italic className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline (Ctrl+U)">
                    <UnderlineIcon className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
                    <Strikethrough className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
                    <Code className="h-4 w-4" />
                </ToolbarButton>

                <Divider />

                {/* Alignment */}
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left">
                    <AlignLeft className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center">
                    <AlignCenter className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right">
                    <AlignRight className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} title="Justify">
                    <AlignJustify className="h-4 w-4" />
                </ToolbarButton>

                <Divider />

                {/* Lists */}
                <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
                    <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
                    <ListOrdered className="h-4 w-4" />
                </ToolbarButton>

                <Divider />

                {/* Block elements */}
                <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote">
                    <Quote className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block">
                    <Code2 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal divider">
                    <Minus className="h-4 w-4" />
                </ToolbarButton>

                <Divider />

                {/* Link */}
                <ToolbarButton onClick={setLink} active={editor.isActive('link')} title="Insert link">
                    <LinkIcon className="h-4 w-4" />
                </ToolbarButton>
                {editor.isActive('link') && (
                    <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()} title="Remove link">
                        <Link2Off className="h-4 w-4" />
                    </ToolbarButton>
                )}

                {/* Image */}
                <ToolbarButton onClick={addImage} title="Insert image" disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                </ToolbarButton>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                />

                {/* Table */}
                <ToolbarButton onClick={insertTable} active={editor.isActive('table')} title="Insert table">
                    <TableIcon className="h-4 w-4" />
                </ToolbarButton>
            </div>

            {/* Editor area */}
            <div style={{ minHeight }} className="relative">
                <EditorContent editor={editor} className="h-full" />
            </div>

            {/* Editor styles */}
            <style jsx global>{`
                .tiptap p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #94a3b8;
                    pointer-events: none;
                    height: 0;
                }
                .tiptap {
                    min-height: ${minHeight}px;
                }
                .tiptap table {
                    border-collapse: collapse;
                    width: 100%;
                    margin: 1rem 0;
                    border-radius: 0.5rem;
                    overflow: hidden;
                }
                .tiptap td, .tiptap th {
                    border: 1px solid #e2e8f0;
                    padding: 0.5rem 0.75rem;
                    min-width: 80px;
                    vertical-align: top;
                    position: relative;
                }
                .dark .tiptap td, .dark .tiptap th {
                    border-color: rgba(255,255,255,0.08);
                }
                .tiptap th {
                    background: #f8fafc;
                    font-weight: 600;
                    font-size: 0.85em;
                }
                .dark .tiptap th {
                    background: rgba(255,255,255,0.04);
                }
                .tiptap .selectedCell:after {
                    background: rgba(99,102,241,0.15);
                    content: "";
                    left: 0; right: 0; top: 0; bottom: 0;
                    pointer-events: none;
                    position: absolute;
                    z-index: 2;
                }
                .tiptap pre {
                    background: #0f172a;
                    color: #e2e8f0;
                    border-radius: 0.75rem;
                    padding: 1rem 1.25rem;
                    font-size: 0.875rem;
                    overflow-x: auto;
                    margin: 1rem 0;
                }
                .tiptap code {
                    background: rgba(99,102,241,0.1);
                    border-radius: 0.25rem;
                    padding: 0.125rem 0.375rem;
                    font-size: 0.875em;
                    color: #6366f1;
                }
                .tiptap pre code {
                    background: none;
                    padding: 0;
                    color: inherit;
                    font-size: inherit;
                }
                .tiptap blockquote {
                    border-left: 3px solid #6366f1;
                    padding-left: 1rem;
                    margin: 1rem 0;
                    color: #64748b;
                    font-style: italic;
                }
                .dark .tiptap blockquote {
                    color: #94a3b8;
                }
                .tiptap hr {
                    border: none;
                    border-top: 1px solid #e2e8f0;
                    margin: 1.5rem 0;
                }
                .dark .tiptap hr {
                    border-color: rgba(255,255,255,0.08);
                }
                .tiptap h1 { font-size: 1.875rem; font-weight: 800; margin: 1.5rem 0 0.75rem; }
                .tiptap h2 { font-size: 1.5rem; font-weight: 700; margin: 1.25rem 0 0.5rem; }
                .tiptap h3 { font-size: 1.25rem; font-weight: 600; margin: 1rem 0 0.5rem; }
                .tiptap ul, .tiptap ol { padding-left: 1.5rem; margin: 0.75rem 0; }
                .tiptap li { margin: 0.25rem 0; }
                .tiptap ul li { list-style-type: disc; }
                .tiptap ol li { list-style-type: decimal; }
                .tiptap a { color: #6366f1; text-decoration: underline; }
                .tiptap p { margin: 0.5rem 0; line-height: 1.7; }
            `}</style>
        </div>
    );
}
