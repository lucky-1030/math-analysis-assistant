import { useState, useMemo, useEffect } from 'react';
import api from './api';
import UploadZone from './components/UploadZone';
import ChapterSidebar from './components/ChapterSidebar';
import KnowledgeGraph from './components/KnowledgeGraph';
import KnowledgePanel from './components/KnowledgePanel';
import StudyPath from './components/StudyPath';
import type { KnowledgeNode } from './data/mockData';
import { getChapterData, chapters as staticChapters } from './data/chapters';

type TabType = 'graph' | 'path';

interface ChapterData {
  id: string;
  title: string;
  nodes: KnowledgeNode[];
  edges: any[];
  path: any[];
  total_pages: number;
}

function App() {
  const [currentChapterId, setCurrentChapterId] = useState('');
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('graph');

  // 动态章节数据库（上传后添加 + 启动时从后端加载）
  const [dynamicChapters, setDynamicChapters] = useState<Record<string, ChapterData>>({});
  const [loadedFromServer, setLoadedFromServer] = useState(false);

  // 应用启动时从后端加载已保存的章节
  useEffect(() => {
    const loadChapters = async () => {
      try {
        // 1. 获取章节列表
        const listResp = await api.get('/api/chapters');
        const chapterList: { id: string; title: string; node_count: number; edge_count: number }[] =
          listResp.data.chapters || [];

        // 2. 逐个获取完整数据
        const loaded: Record<string, ChapterData> = {};
        for (const ch of chapterList) {
          try {
            const detailResp = await api.get(`/api/chapters/${ch.id}`);
            const d = detailResp.data;
            loaded[ch.id] = {
              id: d.id,
              title: d.title,
              nodes: d.nodes || [],
              edges: d.edges || [],
              path: d.path || [],
              total_pages: d.total_pages || 1,
            };
          } catch {
            // 跳过加载失败的章节
          }
        }

        if (Object.keys(loaded).length > 0) {
          setDynamicChapters(loaded);
          // 自动切到第一个已加载的章节
          const firstId = Object.keys(loaded)[0];
          setCurrentChapterId(firstId);
        }
      } catch {
        // 后端不可用时静默失败
      } finally {
        setLoadedFromServer(true);
      }
    };
    loadChapters();
  }, []);

  // 合并静态和动态章节
  const allChapters = useMemo(() => {
    const result = [...staticChapters];
    for (const ch of Object.values(dynamicChapters)) {
      if (!result.find((c) => c.id === ch.id)) {
        result.push({
          id: ch.id,
          title: ch.title,
          book: '上传的教材',
          description: `共 ${ch.nodes.length} 个知识点`,
          nodeCount: ch.nodes.length,
          edgeCount: ch.edges.length,
          estimatedDays: ch.path.reduce((sum: number, p: any) => sum + (p.days || 1), 0),
        });
      }
    }
    return result;
  }, [dynamicChapters]);

  // 获取当前章节数据
  const chapterData = useMemo(() => {
    if (dynamicChapters[currentChapterId]) {
      return dynamicChapters[currentChapterId];
    }
    return getChapterData(currentChapterId);
  }, [currentChapterId, dynamicChapters]);

  const hasData = chapterData.nodes.length > 0;

  // 上传成功回调
  const handleUploadSuccess = (data: any) => {
    if (data.chapter_id && data.nodes) {
      const newChapter: ChapterData = {
        id: data.chapter_id,
        title: data.title || '新上传的教材',
        nodes: data.nodes,
        edges: data.edges || [],
        path: data.path || [],
        total_pages: data.total_pages || 1,
      };
      setDynamicChapters((prev) => ({ ...prev, [newChapter.id]: newChapter }));
      setCurrentChapterId(newChapter.id);
      setSelectedNode(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface-alt flex flex-col">
      {/* 顶部导航 */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white text-lg font-bold">
              ∑
            </div>
            <div>
              <h1 className="text-lg font-bold text-text leading-tight">
                数学分析学习助手
              </h1>
              <p className="text-xs text-text-secondary">
                智能提取 · 知识图谱 · 复习规划
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded border border-green-200">
              ● 本地开发模式
            </span>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-6">
        {/* 上传区域 */}
        <section className="mb-6">
          <UploadZone onUploadSuccess={handleUploadSuccess} />
        </section>

        {loadedFromServer && (
          <>
            {/* 章节信息 */}
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-text">
                  {hasData ? `📖 ${chapterData.title}` : '📖 请上传教材'}
                </h2>
                {hasData && (
                  <p className="text-sm text-text-secondary">
                    共提取 {chapterData.nodes.length} 个知识点，
                    {chapterData.edges.length} 条关联
                  </p>
                )}
              </div>

              {/* Tab 切换 */}
              <div className="flex bg-white rounded-lg border border-border p-1 shadow-sm">
                <button
                  onClick={() => setActiveTab('graph')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'graph'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-secondary hover:text-text'
                  }`}
                >
                  知识图谱
                </button>
                <button
                  onClick={() => setActiveTab('path')}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                    activeTab === 'path'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-text-secondary hover:text-text'
                  }`}
                >
                  学习路径
                </button>
              </div>
            </div>

            {/* 三栏布局：章节侧边栏 + 主内容 + 详情面板 */}
            <div className="flex gap-4 h-[calc(100vh-320px)] min-h-[600px]">
              {/* 左侧：章节导航 */}
              <ChapterSidebar
                chapters={allChapters}
                currentChapterId={currentChapterId}
                onChapterChange={(id) => {
                  setCurrentChapterId(id);
                  setSelectedNode(null);
                }}
              />

              {/* 中间：图谱或路径 */}
              <div className="flex-1 min-w-0">
                {hasData ? (
                  activeTab === 'graph' ? (
                    <KnowledgeGraph
                      nodes={chapterData.nodes}
                      edges={chapterData.edges}
                      onNodeSelect={setSelectedNode}
                      selectedNodeId={selectedNode?.id}
                    />
                  ) : (
                    <StudyPath path={chapterData.path} />
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary gap-3 border border-border rounded-xl bg-white">
                    <div className="text-4xl">📂</div>
                    <p className="text-sm">该章节暂无知识点数据</p>
                    <p className="text-xs">请先上传教材或切换到有数据的章节</p>
                  </div>
                )}
              </div>

              {/* 右侧：知识点详情 */}
              <div className="w-[380px] shrink-0 rounded-xl overflow-hidden shadow-sm">
                <KnowledgePanel
                  node={selectedNode}
                  onClose={() => setSelectedNode(null)}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
