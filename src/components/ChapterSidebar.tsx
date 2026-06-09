import { BookOpen, ChevronRight } from 'lucide-react';

interface ChapterInfo {
  id: string;
  title: string;
  description: string;
  nodeCount: number;
  edgeCount: number;
  estimatedDays: number;
}

interface ChapterSidebarProps {
  chapters: ChapterInfo[];
  currentChapterId: string;
  onChapterChange: (chapterId: string) => void;
}

export default function ChapterSidebar({ chapters, currentChapterId, onChapterChange }: ChapterSidebarProps) {
  return (
    <div className="w-[260px] shrink-0 bg-white rounded-xl border border-border shadow-sm flex flex-col overflow-hidden">
      <div className="p-4 border-b border-border bg-surface-alt">
        <div className="flex items-center gap-2 text-text">
          <BookOpen size={18} className="text-primary" />
          <h3 className="text-sm font-bold">章节导航</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {chapters.length === 0 ? (
          <div className="text-center py-8 text-xs text-text-secondary">
            暂无章节数据，请上传教材
          </div>
        ) : (
          chapters.map((chapter) => {
            const isActive = chapter.id === currentChapterId;
            const hasData = chapter.nodeCount > 0;

            return (
              <button
                key={chapter.id}
                onClick={() => onChapterChange(chapter.id)}
                className={`w-full text-left p-3 rounded-lg transition-all group ${
                  isActive
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-surface-alt border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-semibold mb-1 ${isActive ? 'text-primary' : 'text-text'}`}>
                      {chapter.title}
                    </div>
                    <div className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
                      {chapter.description}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 bg-surface-alt rounded text-text-secondary">
                        {hasData ? `${chapter.nodeCount} 知识点` : '暂无数据'}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-surface-alt rounded text-text-secondary">
                        约 {chapter.estimatedDays} 天
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    size={14}
                    className={`mt-0.5 shrink-0 transition-transform ${
                      isActive ? 'text-primary rotate-90' : 'text-text-secondary group-hover:translate-x-0.5'
                    }`}
                  />
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="p-3 border-t border-border text-[10px] text-text-secondary text-center">
        点击章节切换教材内容
      </div>
    </div>
  );
}
