// "use client"
import dynamic from "next/dynamic";
const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  useState,
  useCallback,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
} from "react";

// ---------------------------------------------------------------------------
// Utility: recursively extract plain text from a React node tree.
// rehype-highlight wraps every token in <span> elements, so the children of
// <code> are no longer a plain string — String(node) would yield "[object Object]".
// ---------------------------------------------------------------------------
function extractText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (typeof node === "boolean" || node == null) return "";
  if (Array.isArray(node)) return node.map(extractText).join("");
  // React element
  const el = node as ReactElement<{ children?: ReactNode }>;
  if (el.props?.children !== undefined) return extractText(el.props.children);
  return "";
}

// ---------------------------------------------------------------------------
// Sub-component: isolated copy button — owns its own "copied" state so that
// multiple code blocks on the same page never share state.
// ---------------------------------------------------------------------------
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that block clipboard in non-secure contexts
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  if (copied) {
    return (
      <span className="ml-2 text-green-400 text-[11px] px-2 py-1 select-none">
        Copied!
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy code to clipboard"
      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-gray-400 transition hover:bg-gray-800 hover:text-gray-200"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
      </svg>
      Copy
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function MarkdownRenderer({ response }: { response: string }) {
  return (
    <div className="prose prose-slate max-w-none text-[15px] leading-7 text-gray-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // ── Headings ──────────────────────────────────────────────────
          h1: ({ children }) => (
            <h1 className="text-lg mt-6 mb-3 font-bold tracking-tight text-gray-900 border-b border-gray-200 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mt-5 mb-2 font-semibold tracking-tight text-gray-900">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mt-4 mb-1.5 font-semibold text-gray-800">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mt-3 mb-1 text-base font-semibold text-gray-800">
              {children}
            </h4>
          ),

          // ── Paragraph ─────────────────────────────────────────────────
          p: ({ children }) => (
            <p className="my-3 text-sm leading-7 text-gray-800">{children}</p>
          ),

          // ── Lists ─────────────────────────────────────────────────────
          ul: ({ children }) => (
            <ul className="my-3 ml-2 space-y-1.5 list-none">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 ml-2 space-y-1.5 list-none counter-reset-[item]">
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => {
            const isOrdered = "index" in props;
            return (
              <li className="text-sm flex items-start gap-2.5 text-gray-800">
                {isOrdered ? (
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-500">
                    {(props as { index: number }).index + 1}
                  </span>
                ) : (
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                )}
                <span className="flex-1">{children}</span>
              </li>
            );
          },

          // ── Pre ───────────────────────────────────────────────────────
          // Block code is handled HERE in `pre`, not in `code`.
          // This guarantees we never render a <div> inside a <p>,
          // which would cause the hydration error.
          pre: ({ children }) => {
            const codeEl = children as ReactElement<
              ComponentPropsWithoutRef<"code">
            >;
            const className = codeEl?.props?.className ?? "";
            const match = /language-(\w+)/.exec(className);
            const lang = match?.[1];

            // Extract raw text from the highlighted React tree for clipboard
            const rawText = extractText(
              codeEl?.props?.children as ReactNode,
            ).replace(/\n$/, "");

            return (
              <div className="my-4 overflow-hidden rounded-xl border border-gray-200 bg-gray-300 shadow-md w-full">
                {lang && (
                  <div className="flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-2">
                    <span className="font-mono text-[11px] font-medium uppercase tracking-widest text-gray-400">
                      {lang}
                    </span>
                    <CopyButton text={rawText} />
                  </div>
                )}
                <pre className="overflow-x-auto p-4 m-0 bg-transparent">
                  {children}
                </pre>
              </div>
            );
          },

          // ── Code ──────────────────────────────────────────────────────
          // Only runs for INLINE code (bare `backticks` in prose).
          // Block code (<pre><code>) is handled by the `pre` override above.
          code: ({ className, children, ...props }) => {
            const isBlock = /language-(\w+)/.test(className ?? "");
            if (isBlock) {
              return (
                <code
                  className={`font-mono text-[13px] leading-relaxed ${className ?? ""}`}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-[13px] text-rose-600"
                {...props}
              >
                {children}
              </code>
            );
          },

          // ── Blockquote ────────────────────────────────────────────────
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-blue-400 bg-blue-50 py-2 pl-4 pr-3 text-gray-700 italic rounded-r-lg">
              {children}
            </blockquote>
          ),

          // ── Horizontal Rule ───────────────────────────────────────────
          hr: () => <hr className="my-6 border-t border-gray-200" />,

          // ── Links ─────────────────────────────────────────────────────
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 underline decoration-blue-300 underline-offset-2 transition hover:text-blue-800 hover:decoration-blue-600"
            >
              {children}
            </a>
          ),

          // ── Tables ────────────────────────────────────────────────────
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-gray-100 bg-white">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="transition hover:bg-gray-50">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 text-gray-700">{children}</td>
          ),

          // ── Strong / Em ───────────────────────────────────────────────
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-700">{children}</em>
          ),

          // ── Strikethrough ─────────────────────────────────────────────
          del: ({ children }) => (
            <del className="text-gray-400 line-through">{children}</del>
          ),
        }}
      >
        {response}
      </ReactMarkdown>
    </div>
  );
}
