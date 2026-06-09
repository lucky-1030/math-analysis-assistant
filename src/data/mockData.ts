// 基于《数学分析讲义2》第三章 欧几里得空间 的知识结构模拟数据

export interface KnowledgeNode {
  id: string;
  label: string;
  type: 'definition' | 'theorem' | 'lemma' | 'corollary' | 'concept' | 'example';
  content: string;
  chapter: string;
  page?: string;
  latex?: string;
}

export interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  type: 'prerequisite' | 'generalizes' | 'specializes' | 'applies' | 'implies' | 'equivalent';
  label?: string;
}

export const mockNodes: KnowledgeNode[] = [
  {
    id: 'n1',
    label: 'n维欧几里得空间',
    type: 'definition',
    content: '**定义**：设 $\\mathbb{R}^n = \\{(x_1, x_2, \\ldots, x_n) \\mid x_i \\in \\mathbb{R}, i=1,2,\\ldots,n\\}$，即所有 $n$ 元实数组的集合。在 $\\mathbb{R}^n$ 中定义加法和数乘运算：对于 $x=(x_1,\\ldots,x_n)$, $y=(y_1,\\ldots,y_n)$, $\\lambda \\in \\mathbb{R}$，$$x + y = (x_1+y_1, \\ldots, x_n+y_n), \\quad \\lambda x = (\\lambda x_1, \\ldots, \\lambda x_n)$$则 $\\mathbb{R}^n$ 构成一个实线性空间，称为 **n维欧几里得空间**。',
    chapter: '第三章 欧几里得空间',
    page: '第65页',
    latex: '\\mathbb{R}^n'
  },
  {
    id: 'n2',
    label: '内积（点积）',
    type: 'definition',
    content: '**定义**：对于 $x=(x_1,\\ldots,x_n)$, $y=(y_1,\\ldots,y_n) \\in \\mathbb{R}^n$，定义它们的**内积**（或点积）为：$$\\langle x, y \\rangle = \\sum_{i=1}^{n} x_i y_i = x_1 y_1 + x_2 y_2 + \\cdots + x_n y_n$$内积满足以下性质：(1) 对称性 $\\langle x,y \\rangle = \\langle y,x \\rangle$；(2) 线性性 $\\langle \\lambda x + \\mu y, z \\rangle = \\lambda \\langle x,z \\rangle + \\mu \\langle y,z \\rangle$；(3) 正定性 $\\langle x,x \\rangle \\geq 0$，且等号成立当且仅当 $x=0$。',
    chapter: '第三章 欧几里得空间',
    page: '第66页',
    latex: '\\langle x, y \\rangle'
  },
  {
    id: 'n3',
    label: '范数（模/长度）',
    type: 'definition',
    content: '**定义**：向量 $x \\in \\mathbb{R}^n$ 的**范数**（或模、长度）定义为：$$\\|x\\| = \\sqrt{\\langle x, x \\rangle} = \\sqrt{\\sum_{i=1}^{n} x_i^2}$$特别地，当 $n=1$ 时，$\\|x\\| = |x|$ 就是绝对值；当 $n=2,3$ 时，就是通常的几何长度。',
    chapter: '第三章 欧几里得空间',
    page: '第67页',
    latex: '\\|x\\|'
  },
  {
    id: 'n4',
    label: '柯西-施瓦茨不等式',
    type: 'theorem',
    content: '**定理（Cauchy-Schwarz）**：对于任意 $x, y \\in \\mathbb{R}^n$，有 $$|\\langle x, y \\rangle| \\leq \\|x\\| \\cdot \\|y\\|$$等号成立当且仅当 $x$ 与 $y$ 线性相关（即存在实数 $\\lambda$ 使得 $x = \\lambda y$ 或 $y = \\lambda x$）。',
    chapter: '第三章 欧几里得空间',
    page: '第68页',
    latex: '|\\langle x, y \\rangle| \\leq \\|x\\| \\cdot \\|y\\|'
  },
  {
    id: 'n5',
    label: '三角不等式',
    type: 'theorem',
    content: '**定理**：对于任意 $x, y \\in \\mathbb{R}^n$，有 $$\\|x + y\\| \\leq \\|x\\| + \\|y\\|$$等号成立当且仅当 $x$ 与 $y$ 同向（存在 $\\lambda \\geq 0$ 使得 $x = \\lambda y$）。\\n\\n**证明**：利用柯西-施瓦茨不等式，$$\\|x+y\\|^2 = \\langle x+y, x+y \\rangle = \\|x\\|^2 + 2\\langle x,y \\rangle + \\|y\\|^2 \\leq \\|x\\|^2 + 2\\|x\\|\\|y\\| + \\|y\\|^2 = (\\|x\\|+\\|y\\|)^2$$两边开方即得结论。',
    chapter: '第三章 欧几里得空间',
    page: '第69页',
    latex: '\\|x + y\\| \\leq \\|x\\| + \\|y\\|'
  },
  {
    id: 'n6',
    label: '距离',
    type: 'definition',
    content: '**定义**：对于 $x, y \\in \\mathbb{R}^n$，定义它们之间的**距离**为 $$d(x,y) = \\|x - y\\| = \\sqrt{\\sum_{i=1}^{n}(x_i - y_i)^2}$$距离满足：(1) 正定性 $d(x,y) \\geq 0$ 且 $d(x,y)=0 \\Leftrightarrow x=y$；(2) 对称性 $d(x,y)=d(y,x)$；(3) 三角不等式 $d(x,z) \\leq d(x,y) + d(y,z)$。',
    chapter: '第三章 欧几里得空间',
    page: '第70页',
    latex: 'd(x,y) = \\|x - y\\|'
  },
  {
    id: 'n7',
    label: '开球与闭球',
    type: 'definition',
    content: '**定义**：设 $a \\in \\mathbb{R}^n$，$r > 0$。\\n- **开球**：$B(a, r) = \\{x \\in \\mathbb{R}^n \\mid \\|x-a\\| < r\\}$\\n- **闭球**：$\\overline{B}(a, r) = \\{x \\in \\mathbb{R}^n \\mid \\|x-a\\| \\leq r\\}$\\n- **球面**：$S(a, r) = \\{x \\in \\mathbb{R}^n \\mid \\|x-a\\| = r\\}$',
    chapter: '第三章 欧几里得空间',
    page: '第71页',
    latex: 'B(a, r)'
  },
  {
    id: 'n8',
    label: '邻域',
    type: 'definition',
    content: '**定义**：点 $a$ 的**r邻域**就是开球 $B(a,r)$。有时也用到**去心邻域**：$$\\mathring{B}(a,r) = B(a,r) \\setminus \\{a\\} = \\{x \\in \\mathbb{R}^n \\mid 0 < \\|x-a\\| < r\\}$$',
    chapter: '第三章 欧几里得空间',
    page: '第71页',
    latex: '\\mathring{B}(a,r)'
  },
  {
    id: 'n9',
    label: '有界集',
    type: 'definition',
    content: '**定义**：集合 $E \\subseteq \\mathbb{R}^n$ 称为**有界集**，如果存在 $M > 0$ 使得 $\\|x\\| \\leq M$ 对所有 $x \\in E$ 成立，等价于 $E$ 包含在某个以原点为中心的闭球中。\\n\\n若 $E$ 不是有界集，则称为**无界集**。',
    chapter: '第三章 欧几里得空间',
    page: '第72页'
  },
  {
    id: 'n10',
    label: '点与集合的关系',
    type: 'concept',
    content: '对于 $E \\subseteq \\mathbb{R}^n$ 和点 $a \\in \\mathbb{R}^n$，有以下分类：\\n\\n1. **内点**：存在 $r > 0$ 使得 $B(a,r) \\subseteq E$。$E$ 的所有内点构成 $E$ 的**内部**，记为 $E^\\circ$。\\n2. **外点**：存在 $r > 0$ 使得 $B(a,r) \\cap E = \\varnothing$。\\n3. **边界点**：对任意 $r > 0$，$B(a,r)$ 中既有 $E$ 的点也有 $E^c$ 的点。边界全体记为 $\\partial E$。\\n4. **聚点（极限点）**：对任意 $r > 0$，去心邻域 $\\mathring{B}(a,r)$ 与 $E$ 相交非空。\\n5. **孤立点**：$a \\in E$ 且存在 $r > 0$ 使得 $\\mathring{B}(a,r) \\cap E = \\varnothing$。',
    chapter: '第三章 欧几里得空间',
    page: '第73-74页'
  },
  {
    id: 'n11',
    label: '开集与闭集',
    type: 'definition',
    content: '**定义**：\\n- 若 $E$ 的每一点都是内点，即 $E = E^\\circ$，则称 $E$ 为**开集**。\\n- 若 $E$ 的补集 $E^c$ 是开集，则称 $E$ 为**闭集**。\\n- 等价地，$E$ 是闭集当且仅当 $E$ 包含其所有聚点。\\n\\n**例子**：开球 $B(a,r)$ 是开集；闭球 $\\overline{B}(a,r)$ 是闭集。',
    chapter: '第三章 欧几里得空间',
    page: '第75页'
  },
  {
    id: 'n12',
    label: '开集与闭集的基本性质',
    type: 'theorem',
    content: '**定理**：\\n1. 任意多个开集的并仍是开集；有限个开集的交仍是开集。\\n2. 任意多个闭集的交仍是闭集；有限个闭集的并仍是闭集。\\n\\n**注意**：无限个开集的交不一定是开集（例如 $\\bigcap_{n=1}^\\infty (-\\frac{1}{n}, \\frac{1}{n}) = \\{0\\}$ 是闭集）。',
    chapter: '第三章 欧几里得空间',
    page: '第76页'
  },
  {
    id: 'n13',
    label: '闭包',
    type: 'definition',
    content: '**定义**：集合 $E$ 的**闭包**定义为 $\\overline{E} = E \\cup E\' $，其中 $E\' $ 是 $E$ 的所有聚点构成的集合（导集）。\\n\\n等价刻画：$\\overline{E} = E \\cup \\partial E = (E^c)^\\circ)^c$。\\n\\n$\\overline{E}$ 是包含 $E$ 的最小闭集。',
    chapter: '第三章 欧几里得空间',
    page: '第77页',
    latex: '\\overline{E}'
  },
  {
    id: 'n14',
    label: 'Bolzano-Weierstrass定理',
    type: 'theorem',
    content: '**定理**：$\\mathbb{R}^n$ 中任意有界无穷点集必有聚点。\\n\\n**等价形式**：有界点列必有收敛子列。\\n\\n这是实数系基本定理在高维的推广，是证明紧性等性质的基础。',
    chapter: '第三章 欧几里得空间',
    page: '第79页'
  },
  {
    id: 'n15',
    label: '紧集',
    type: 'definition',
    content: '**定义**：集合 $E \\subseteq \\mathbb{R}^n$ 称为**紧集**，如果 $E$ 的任意开覆盖都有有限子覆盖。\\n\\n**Heine-Borel定理**：在 $\\mathbb{R}^n$ 中，$E$ 是紧集当且仅当 $E$ 是有界闭集。\\n\\n紧集上的连续函数有非常重要的性质：有界性、最值可达、一致连续。',
    chapter: '第三章 欧几里得空间',
    page: '第80-81页'
  }
];

export const mockEdges: KnowledgeEdge[] = [
  { id: 'e1', source: 'n1', target: 'n2', type: 'prerequisite', label: '基于' },
  { id: 'e2', source: 'n2', target: 'n3', type: 'implies', label: '导出' },
  { id: 'e3', source: 'n3', target: 'n4', type: 'prerequisite', label: '需要' },
  { id: 'e4', source: 'n4', target: 'n5', type: 'applies', label: '用于证明' },
  { id: 'e5', source: 'n3', target: 'n6', type: 'applies', label: '定义' },
  { id: 'e6', source: 'n6', target: 'n7', type: 'applies', label: '基于' },
  { id: 'e7', source: 'n7', target: 'n8', type: 'generalizes', label: '推广' },
  { id: 'e8', source: 'n7', target: 'n9', type: 'applies', label: '用于定义' },
  { id: 'e9', source: 'n7', target: 'n10', type: 'prerequisite', label: '需要' },
  { id: 'e10', source: 'n10', target: 'n11', type: 'implies', label: '定义' },
  { id: 'e11', source: 'n11', target: 'n12', type: 'implies', label: '性质' },
  { id: 'e12', source: 'n10', target: 'n13', type: 'implies', label: '构成' },
  { id: 'e13', source: 'n9', target: 'n14', type: 'prerequisite', label: '条件' },
  { id: 'e14', source: 'n11', target: 'n15', type: 'prerequisite', label: '需要' },
  { id: 'e15', source: 'n9', target: 'n15', type: 'prerequisite', label: '条件' },
  { id: 'e16', source: 'n14', target: 'n15', type: 'applies', label: '用于证明' }
];

// 学习路径建议（拓扑排序后的复习顺序）
export const studyPath = [
  { id: 'n1', title: 'n维欧几里得空间', days: 1, reason: '基础概念，理解空间结构' },
  { id: 'n2', title: '内积（点积）', days: 1, reason: '后续所有度量概念的基石' },
  { id: 'n3', title: '范数（模/长度）', days: 1, reason: '由内积导出，理解几何意义' },
  { id: 'n4', title: '柯西-施瓦茨不等式', days: 2, reason: '核心工具，证明技巧重要' },
  { id: 'n5', title: '三角不等式', days: 1, reason: '范数的基本性质' },
  { id: 'n6', title: '距离', days: 1, reason: '范数的直接应用' },
  { id: 'n7', title: '开球与闭球', days: 1, reason: '拓扑概念的具体化' },
  { id: 'n8', title: '邻域', days: 1, reason: '极限语言的基础' },
  { id: 'n9', title: '有界集', days: 1, reason: '简单但重要的分类' },
  { id: 'n10', title: '点与集合的关系', days: 2, reason: '概念密集，需仔细辨析内点/外点/边界点/聚点' },
  { id: 'n11', title: '开集与闭集', days: 2, reason: '拓扑核心概念，注意例子' },
  { id: 'n12', title: '开集与闭集的基本性质', days: 1, reason: '掌握有限与无限的差别' },
  { id: 'n13', title: '闭包', days: 1, reason: '联系点分类与闭集' },
  { id: 'n14', title: 'Bolzano-Weierstrass定理', days: 2, reason: '证明重要，紧性铺垫' },
  { id: 'n15', title: '紧集', days: 2, reason: '本章高潮，Heine-Borel定理必考' }
];
