import { mockNodes } from '../data/mockData';

interface StudyPathItem {
  id: string;
  title: string;
  days: number;
  reason: string;
}

interface StudyPathProps {
  path?: StudyPathItem[];
}

export default function StudyPath({ path }: StudyPathProps) {
  if (!path || path.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary gap-3 bg-white rounded-xl border border-border shadow-sm">
        <div className="text-4xl">📅</div>
        <p className="text-sm">该章节暂无学习路径数据</p>
      </div>
    );
  }

  const totalDays = path.reduce((sum, item) => sum + item.days, 0);

  const getNodeType = (id: string) => {
    const node = mockNodes.find((n) => n.id === id);
    return node?.type || 'concept';
  };

  const typeColors: Record<string, string> = {
    definition: 'bg-blue-500',
    theorem: 'bg-green-500',
    lemma: 'bg-purple-500',
    corollary: 'bg-cyan-500',
    concept: 'bg-amber-500',
    example: 'bg-red-500',
  };

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      {/* 头部 */}
      <div className="p-5 border-b border-border bg-surface-alt">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-text">📅 建议学习路径</h2>
          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
            预计 {totalDays} 天
          </span>
        </div>
        <p className="text-xs text-text-secondary">
          基于知识点依赖关系生成的复习顺序，帮助你高效备考期末考试
        </p>
      </div>

      {/* 时间线 */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="relative">
          {/* 竖线 */}
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-border" />

          <div className="space-y-4">
            {path.map((item, index) => {
              const nodeType = getNodeType(item.id);
              const colorClass = typeColors[nodeType] || 'bg-gray-400';
              const dayOffset = path
                .slice(0, index)
                .reduce((sum, s) => sum + s.days, 0);

              return (
                <div key={item.id} className="relative flex gap-4 group">
                  {/* 节点圆点 */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full ${colorClass} text-white flex items-center justify-center text-xs font-bold shadow-sm ring-4 ring-white`}
                    >
                      {index + 1}
                    </div>
                  </div>

                  {/* 内容卡片 */}
                  <div className="flex-1 pb-2">
                    <div className="bg-surface-alt rounded-lg border border-border p-3 hover:border-primary-light transition-colors">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-sm font-semibold text-text">
                          {item.title}
                        </h3>
                        <span className="text-[10px] px-1.5 py-0.5 bg-white rounded border border-border text-text-secondary whitespace-nowrap">
                          第{dayOffset + 1}天
                          {item.days > 1 ? ` - 第${dayOffset + item.days}天` : ''}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        {item.reason}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
