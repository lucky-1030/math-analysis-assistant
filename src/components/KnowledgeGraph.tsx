import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  Panel,
  MarkerType,
} from 'reactflow';
import type { Edge, Node } from 'reactflow';
import { Search, Filter, Focus, RotateCcw } from 'lucide-react';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import type { KnowledgeNode, KnowledgeEdge } from '../data/mockData';

interface KnowledgeGraphProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  onNodeSelect: (node: KnowledgeNode) => void;
  selectedNodeId?: string;
}

// 节点类型颜色
const typeColors: Record<string, string> = {
  definition: '#3b82f6',
  theorem: '#10b981',
  lemma: '#8b5cf6',
  corollary: '#06b6d4',
  concept: '#f59e0b',
  example: '#ef4444',
};

const typeLabels: Record<string, string> = {
  definition: '定义',
  theorem: '定理',
  lemma: '引理',
  corollary: '推论',
  concept: '概念',
  example: '例题',
};

// 边关系类型颜色和标签
const edgeTypeStyles: Record<string, { color: string; label: string; dash: string }> = {
  prerequisite: { color: '#3b82f6', label: '前置', dash: '' },
  implies: { color: '#10b981', label: '蕴含', dash: '8,4' },
  applies: { color: '#f59e0b', label: '应用', dash: '4,4' },
  generalizes: { color: '#8b5cf6', label: '推广', dash: '8,4' },
  equivalent: { color: '#ef4444', label: '等价', dash: '2,4' },
};

// 节点尺寸常量
const NODE_WIDTH = 160;
const NODE_HEIGHT = 80;

// dagre 层级布局
function getLayoutedElements(
  nodes: KnowledgeNode[],
  edges: KnowledgeEdge[]
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', ranksep: 80, nodesep: 60, marginx: 50, marginy: 50 });

  nodes.forEach((kn) => {
    g.setNode(kn.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // 只对有边的节点对建立连接（用于布局）
  const connectedIds = new Set<string>();
  edges.forEach((ke) => {
    if (nodes.find((n) => n.id === ke.source) && nodes.find((n) => n.id === ke.target)) {
      g.setEdge(ke.source, ke.target);
      connectedIds.add(ke.source);
      connectedIds.add(ke.target);
    }
  });

  // 孤立节点也用 dagre，dagre 会自动处理未连接的节点
  const orphans = nodes.filter((n) => !connectedIds.has(n.id));
  orphans.forEach((n) => {
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  dagre.layout(g);

  const layoutedNodes: Node[] = nodes.map((kn) => {
    const pos = g.node(kn.id);
    const x = pos ? pos.x - NODE_WIDTH / 2 : 0;
    const y = pos ? pos.y - NODE_HEIGHT / 2 : 0;

    return {
      id: kn.id,
      position: { x, y },
      data: { label: kn.label, type: kn.type, original: kn },
      type: 'custom',
    };
  });

  const layoutedEdges: Edge[] = edges.map((ke) => {
    const edgeStyle = edgeTypeStyles[ke.type] || edgeTypeStyles.prerequisite;
    return {
      id: ke.id,
      source: ke.source,
      target: ke.target,
      label: ke.label || edgeStyle.label,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed, color: edgeStyle.color, width: 18, height: 18 },
      style: {
        stroke: edgeStyle.color,
        strokeWidth: 2,
        strokeDasharray: edgeStyle.dash || undefined,
      },
      labelStyle: { fill: edgeStyle.color, fontSize: 10, fontWeight: 600 },
      labelBgStyle: { fill: '#fff', fillOpacity: 0.9 },
      labelBgPadding: [4, 3] as [number, number],
      labelBgBorderRadius: 3,
      animated: ke.type === 'prerequisite',
    };
  });

  return { nodes: layoutedNodes, edges: layoutedEdges };
}

function CustomNode({ data, selectedNodeId, onSelect }: any) {
  const color = typeColors[data.type] || '#64748b';
  const typeLabel = typeLabels[data.type] || data.type;
  const isSelected = selectedNodeId === data.original.id;

  return (
    <>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <div
        className={`px-3 py-2 rounded-lg border-2 shadow-sm min-w-[130px] transition-all duration-200 cursor-pointer hover:shadow-md hover:scale-105 ${
          isSelected ? 'ring-2 ring-offset-2' : ''
        }`}
        style={{
          backgroundColor: isSelected ? '#fff' : '#f8fafc',
          borderColor: color,
          '--tw-ring-color': color,
        } as React.CSSProperties}
        onClick={() => onSelect(data.original)}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white"
            style={{ backgroundColor: color }}
          >
            {typeLabel}
          </span>
        </div>
        <div
          className="text-xs font-medium text-text leading-tight line-clamp-2"
          title={data.label}
        >
          {data.label}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </>
  );
}

export default function KnowledgeGraph({
  nodes: sourceNodes,
  edges: sourceEdges,
  onNodeSelect,
  selectedNodeId,
}: KnowledgeGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [layoutReady, setLayoutReady] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>(Object.keys(typeLabels));
  const [focusMode, setFocusMode] = useState(false);
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);

  const dataKey = useMemo(
    () =>
      sourceNodes.map((n) => n.id).join(',') +
      '|' +
      sourceEdges.map((e) => e.id).join(','),
    [sourceNodes, sourceEdges]
  );

  // 用 dagre 计算布局
  useEffect(() => {
    if (!sourceNodes.length) {
      setNodes([]);
      setEdges([]);
      setLayoutReady(true);
      return;
    }

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      sourceNodes,
      sourceEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    setLayoutReady(true);
  }, [dataKey, sourceNodes, sourceEdges, setNodes, setEdges]);

  const edgesRef = useRef(sourceEdges);
  edgesRef.current = sourceEdges;

  // 搜索 / 筛选 / 聚焦
  useEffect(() => {
    if (!layoutReady || !nodes.length) return;

    const query = searchQuery.toLowerCase().trim();
    const currentEdges = edgesRef.current;

    setNodes((nds) =>
      nds.map((n) => {
        const nodeData = n.data.original as KnowledgeNode;
        const matchesSearch =
          !query ||
          nodeData.label.toLowerCase().includes(query) ||
          nodeData.content.toLowerCase().includes(query);
        const matchesFilter = activeFilters.includes(nodeData.type);

        let opacity = 1;
        if (!matchesSearch || !matchesFilter) opacity = 0.15;

        if (focusMode && focusedNodeId) {
          const isFocused = n.id === focusedNodeId;
          const isConnected = currentEdges.some(
            (e) =>
              (e.source === focusedNodeId && e.target === n.id) ||
              (e.target === focusedNodeId && e.source === n.id)
          );
          if (!isFocused && !isConnected) opacity = 0.05;
        }

        if (selectedNodeId) {
          if (n.id === selectedNodeId) opacity = 1;
          else if (opacity > 0.3) opacity = 0.4;
        }

        return {
          ...n,
          style: { ...n.style, opacity, transition: 'opacity 0.3s' },
        };
      })
    );

    setEdges((eds) =>
      eds.map((e) => {
        let opacity = 1;
        if (focusMode && focusedNodeId) {
          if (e.source !== focusedNodeId && e.target !== focusedNodeId) opacity = 0.05;
        }
        if (selectedNodeId) {
          if (e.source === selectedNodeId || e.target === selectedNodeId) opacity = 1;
          else if (opacity > 0.3) opacity = 0.15;
        }
        return {
          ...e,
          style: { ...e.style, opacity, transition: 'opacity 0.3s' },
        };
      })
    );
  }, [searchQuery, activeFilters, focusMode, focusedNodeId, selectedNodeId, layoutReady]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const original = node.data.original as KnowledgeNode;
      onNodeSelect(original);
      if (focusMode) setFocusedNodeId(node.id);
    },
    [onNodeSelect, focusMode]
  );

  const nodeTypes = useMemo(
    () => ({
      custom: (props: any) => (
        <CustomNode {...props} selectedNodeId={selectedNodeId} onSelect={onNodeSelect} />
      ),
    }),
    [selectedNodeId, onNodeSelect]
  );

  const toggleFilter = (type: string) => {
    setActiveFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const resetAll = () => {
    setSearchQuery('');
    setActiveFilters(Object.keys(typeLabels));
    setFocusMode(false);
    setFocusedNodeId(null);
    onNodeSelect(null as any);
  };

  // 统计各关系类型数量
  const edgeTypeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    sourceEdges.forEach((e) => {
      counts[e.type] = (counts[e.type] || 0) + 1;
    });
    return counts;
  }, [sourceEdges]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-border bg-white shadow-sm flex flex-col">
      {/* 工具栏 */}
      <div className="px-4 py-3 border-b border-border bg-surface-alt flex items-center gap-3 shrink-0 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-[280px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            type="text"
            placeholder="搜索知识点..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-border bg-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-text-secondary mr-1" />
          {Object.entries(typeLabels).map(([type, label]) => {
            const active = activeFilters.includes(type);
            return (
              <button
                key={type}
                onClick={() => toggleFilter(type)}
                className={`text-[10px] px-2 py-1 rounded-full border transition-all ${
                  active
                    ? 'text-white border-transparent'
                    : 'text-text-secondary bg-white border-border hover:border-text-secondary'
                }`}
                style={active ? { backgroundColor: typeColors[type] } : undefined}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex-1" />

        <button
          onClick={() => {
            setFocusMode(!focusMode);
            if (focusMode) setFocusedNodeId(null);
          }}
          className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
            focusMode
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-white border-border text-text-secondary hover:text-text'
          }`}
        >
          <Focus size={13} />
          聚焦
        </button>

        <button
          onClick={resetAll}
          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-border bg-white text-text-secondary hover:text-text transition-all"
        >
          <RotateCcw size={13} />
          重置
        </button>
      </div>

      {/* 图谱 */}
      <div className="flex-1 min-h-0">
        {layoutReady && sourceNodes.length > 0 ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.2}
            maxZoom={1.5}
          >
            <Background color="#e2e8f0" gap={20} size={1} />
            <Controls />
            <Panel position="bottom-left" className="m-4">
              <div className="bg-white/95 backdrop-blur rounded-lg border border-border p-3 shadow-sm max-w-[280px]">
                <h4 className="text-xs font-semibold text-text-secondary mb-2 uppercase tracking-wider">
                  图例
                </h4>
                {/* 节点类型 */}
                <div className="space-y-1 mb-3">
                  {Object.entries(typeLabels).map(([type, label]) => (
                    <div key={type} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: typeColors[type] }}
                      />
                      <span className="text-xs text-text">{label}</span>
                    </div>
                  ))}
                </div>
                {/* 关系类型 */}
                {Object.keys(edgeTypeCounts).length > 0 && (
                  <>
                    <div className="border-t border-border pt-2 mb-1">
                      <span className="text-[10px] text-text-secondary font-semibold">关系</span>
                    </div>
                    <div className="space-y-1">
                      {Object.entries(edgeTypeStyles).map(([type, style]) => {
                        if (!edgeTypeCounts[type]) return null;
                        return (
                          <div key={type} className="flex items-center gap-2">
                            <svg width="24" height="8" className="shrink-0">
                              <line
                                x1="0" y1="4" x2="24" y2="4"
                                stroke={style.color}
                                strokeWidth="2"
                                strokeDasharray={style.dash || undefined}
                              />
                            </svg>
                            <span className="text-xs text-text">
                              {style.label}
                              <span className="text-text-secondary ml-1">
                                ({edgeTypeCounts[type]})
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </Panel>
          </ReactFlow>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary gap-3">
            <div className="text-4xl">📂</div>
            <p className="text-sm">该章节暂无知识点数据</p>
            <p className="text-xs">请先上传教材或切换到有数据的章节</p>
          </div>
        )}
      </div>
    </div>
  );
}
