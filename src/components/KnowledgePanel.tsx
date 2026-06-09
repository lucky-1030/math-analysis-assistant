import { useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { toPng } from 'html-to-image';
import { Download, Image, FileText, X } from 'lucide-react';
import type { KnowledgeNode } from '../data/mockData';

interface KnowledgePanelProps {
  node: KnowledgeNode | null;
  onClose?: () => void;
}

const typeLabels: Record<string, string> = {
  definition: '定义',
  theorem: '定理',
  lemma: '引理',
  corollary: '推论',
  concept: '概念',
  example: '例题',
};

const typeColors: Record<string, string> = {
  definition: 'bg-blue-50 text-blue-700 border-blue-200',
  theorem: 'bg-green-50 text-green-700 border-green-200',
  lemma: 'bg-purple-50 text-purple-700 border-purple-200',
  corollary: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  concept: 'bg-amber-50 text-amber-700 border-amber-200',
  example: 'bg-red-50 text-red-700 border-red-200',
};

export default function KnowledgePanel({ node, onClose }: KnowledgePanelProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  if (!node) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary p-8 border-l border-border bg-white">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-sm text-center">
          点击图谱中的节点
          <br />
          查看知识点详情
        </p>
      </div>
    );
  }

  const typeLabel = typeLabels[node.type] || node.type;
  const typeStyle = typeColors[node.type] || 'bg-gray-50 text-gray-700 border-gray-200';

  // 导出为 Markdown
  const exportMarkdown = () => {
    const md = `# ${node.label}\n\n**类型**: ${typeLabel}\n**章节**: ${node.chapter}${node.page ? `\n**页码**: ${node.page}` : ''}\n\n---\n\n${node.content}\n`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${node.label}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 导出为图片
  const exportImage = async () => {
    if (!contentRef.current) return;
    try {
      const dataUrl = await toPng(contentRef.current, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${node.label}.png`;
      a.click();
    } catch (err) {
      console.error('导出图片失败:', err);
      alert('导出图片失败，请重试');
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-white border-l border-border">
      {/* 头部 */}
      <div className="flex items-start justify-between p-5 border-b border-border">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${typeStyle}`}>
              {typeLabel}
            </span>
            {node.page && (
              <span className="text-xs text-text-secondary">{node.page}</span>
            )}
          </div>
          <h2 className="text-lg font-bold text-text leading-snug">{node.label}</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 text-text-secondary hover:text-text transition-colors p-1 rounded hover:bg-surface-alt"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* 导出按钮栏 */}
      <div className="px-5 py-2 border-b border-border bg-surface-alt flex items-center gap-2">
        <span className="text-[10px] text-text-secondary uppercase tracking-wider font-medium">
          导出
        </span>
        <button
          onClick={exportMarkdown}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-white border border-border hover:border-primary hover:text-primary transition-all"
        >
          <FileText size={12} />
          Markdown
        </button>
        <button
          onClick={exportImage}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-white border border-border hover:border-primary hover:text-primary transition-all"
        >
          <Image size={12} />
          图片卡片
        </button>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-5">
        <div ref={contentRef} className="prose prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              p: ({ children }) => (
                <p className="text-sm leading-relaxed mb-4 text-text">{children}</p>
              ),
              h1: ({ children }) => (
                <h1 className="text-base font-bold mb-3 text-text">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-sm font-bold mb-2 text-text">{children}</h2>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-5 mb-4 text-sm text-text space-y-1">{children}</ul>
              ),
              li: ({ children }) => (
                <li className="text-sm text-text">{children}</li>
              ),
            }}
          >
            {node.content}
          </ReactMarkdown>
        </div>

        {/* 所属章节 */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span>📖</span>
            <span>{node.chapter}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
