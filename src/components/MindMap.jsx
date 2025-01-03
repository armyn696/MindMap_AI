import { useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import SpecialNode from './SpecialNode';

const nodeTypes = {
  special: SpecialNode
};

const flowStyles = {
  width: '100vw',
  height: '100vh',
  background: '#fafafa',
};

// تعریف رنگ‌های مختلف برای شاخه‌ها - رنگ‌های بیشتر و متنوع‌تر
const colors = [
  '#0EA5E9',  // آبی روشن
  '#F97316',  // نارنجی
  '#22C55E',  // سبز
  '#D946EF',  // صورتی
  '#6366F1',  // بنفش روشن
  '#14B8A6',  // فیروزه‌ای
  '#F59E0B',  // نارنجی تیره
  '#8B5CF6',  // بنفش متوسط
  '#10B981',  // سبز زمردی
  '#3B82F6',  // آبی کلاسیک
  '#EF4444',  // قرمز روشن
  '#A855F7',  // بنفش بنفشه
  '#EC4899',  // صورتی گلی
  '#84CC16',  // سبز لیمویی
  '#06B6D4',  // آبی فیروزه‌ای
];

// استایل پایه برای نودها
const nodeStyle = {
  padding: '12px',
  borderRadius: '8px',
  border: '2px solid',
  minWidth: '150px',
  backgroundColor: 'white',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
};

// استایل پایه برای یال‌ها
const edgeStyle = {
  stroke: '#b1b1b7',
  strokeWidth: 2,
  type: 'smoothstep',
};

const getLayoutedElements = (nodes, edges, direction = 'LR') => {
  // پیدا کردن رنگ شاخه اصلی برای هر نود
  const getNodeColor = (nodeId, nodes, edges, rootNode) => {
    if (nodeId === rootNode.id) return '#4B5563';
    
    // پیدا کردن مسیر از نود فعلی تا ریشه و یافتن اولین شاخه متصل به ریشه
    let currentId = nodeId;
    let mainBranchId = null;
    
    while (currentId !== rootNode.id) {
      const edge = edges.find(e => e.target === currentId);
      if (!edge) break;
      
      const sourceId = edge.source;
      if (sourceId === rootNode.id) {
        mainBranchId = currentId;
        break;
      }
      currentId = sourceId;
    }
    
    if (!mainBranchId) return '#4B5563';

    const mainBranches = edges
      .filter(e => e.source === rootNode.id)
      .map(e => e.target);
    
    const branchIndex = mainBranches.indexOf(mainBranchId);
    return colors[branchIndex % colors.length];
  };

  const rootNode = nodes.find(n => !edges.some(e => e.target === n.id));
  if (!rootNode) return { nodes, edges };

  // پیدا کردن همه فرزندان مستقیم نود ریشه
  const directChildren = edges
    .filter(e => e.source === rootNode.id)
    .map(e => e.target);

  // تقسیم فرزندان به دو گروه چپ و راست
  const leftChildren = new Set();
  const rightChildren = new Set();
  
  directChildren.forEach((childId, index) => {
    if (index % 2 === 0) {
      leftChildren.add(childId);
    } else {
      rightChildren.add(childId);
    }
  });

  // تابع کمکی برای پیدا کردن همه زیرشاخه‌های یک نود
  const getAllDescendants = (nodeId, visited = new Set()) => {
    if (visited.has(nodeId)) return visited;
    visited.add(nodeId);
    edges
      .filter(e => e.source === nodeId)
      .forEach(e => getAllDescendants(e.target, visited));
    return visited;
  };

  // اضافه کردن تمام زیرشاخه‌ها به مجموعه‌های چپ و راست
  leftChildren.forEach(childId => {
    getAllDescendants(childId).forEach(id => leftChildren.add(id));
  });
  rightChildren.forEach(childId => {
    getAllDescendants(childId).forEach(id => rightChildren.add(id));
  });

  // ساخت گراف برای سمت چپ
  const leftGraph = new dagre.graphlib.Graph();
  leftGraph.setDefaultEdgeLabel(() => ({}));
  leftGraph.setGraph({
    rankdir: 'LR',
    nodesep: 45,
    ranksep: 30,
    edgesep: 5,
    marginx: 3,
    marginy: 3,
    acyclicer: 'greedy',
    ranker: 'tight-tree',
  });

  // ساخت گراف برای سمت راست
  const rightGraph = new dagre.graphlib.Graph();
  rightGraph.setDefaultEdgeLabel(() => ({}));
  rightGraph.setGraph({
    rankdir: 'LR',
    nodesep: 35,
    ranksep: 30,
    edgesep: 5,
    marginx: 3,
    marginy: 3,
    acyclicer: 'greedy',
    ranker: 'tight-tree',
  });

  // افزودن نودها و یال‌ها به گراف‌های مربوطه
  nodes.forEach(node => {
    let style = {
      ...nodeStyle,
    };

    if (node.id === rootNode.id) {
      style = {
        ...style,
        borderColor: '#4B5563',
        backgroundColor: '#4B556315',
        fontWeight: 'bold',
      };
    } else {
      const color = getNodeColor(node.id, nodes, edges, rootNode);
      style = {
        ...style,
        borderColor: color,
        backgroundColor: `${color}15`,
      };
    }

    const nodeData = {
      width: 250,
      height: 50,
      style
    };

    if (node.id === rootNode.id) {
      leftGraph.setNode(node.id, nodeData);
      rightGraph.setNode(node.id, nodeData);
    } else if (leftChildren.has(node.id)) {
      leftGraph.setNode(node.id, {
        ...nodeData,
        targetPosition: Position.Right,
        sourcePosition: Position.Left
      });
    } else if (rightChildren.has(node.id)) {
      rightGraph.setNode(node.id, {
        ...nodeData,
        targetPosition: Position.Left,
        sourcePosition: Position.Right
      });
    }
  });

  edges.forEach(edge => {
    const target = edge.target;
    if (leftChildren.has(target)) {
      leftGraph.setEdge(edge.source, edge.target);
    } else if (rightChildren.has(target)) {
      rightGraph.setEdge(edge.source, edge.target);
    }
  });

  // اجرای الگوریتم چیدمان برای هر دو گراف
  dagre.layout(leftGraph);
  dagre.layout(rightGraph);

  // محاسبه میانگین موقعیت y برای شاخه‌های چپ و راست
  let leftSum = 0, leftCount = 0;
  let rightSum = 0, rightCount = 0;

  nodes.forEach(node => {
    if (leftChildren.has(node.id)) {
      const pos = leftGraph.node(node.id);
      leftSum += pos.y;
      leftCount++;
    }
    if (rightChildren.has(node.id)) {
      const pos = rightGraph.node(node.id);
      rightSum += pos.y;
      rightCount++;
    }
  });

  const leftAvg = leftCount > 0 ? leftSum / leftCount : 0;
  const rightAvg = rightCount > 0 ? rightSum / rightCount : 0;
  const centerY = (leftAvg + rightAvg) / 2;

  const layoutedNodes = nodes.map(node => {
    let nodeWithPosition;
    let xPos;
    let yPos;
    
    if (node.id === rootNode.id) {
      nodeWithPosition = leftGraph.node(node.id);
      xPos = 0;
      yPos = centerY; // قرار دادن نود مرکزی در میانگین موقعیت y شاخه‌ها
    } else if (leftChildren.has(node.id)) {
      nodeWithPosition = leftGraph.node(node.id);
      xPos = -Math.abs(nodeWithPosition.x * 0.75);
      yPos = nodeWithPosition.y - leftAvg + centerY; // تنظیم موقعیت نسبت به مرکز
    } else if (rightChildren.has(node.id)) {
      nodeWithPosition = rightGraph.node(node.id);
      xPos = Math.abs(nodeWithPosition.x * 0.75);
      yPos = nodeWithPosition.y - rightAvg + centerY; // تنظیم موقعیت نسبت به مرکز
    }

    if (node.id === rootNode.id) {
      return {
        ...node,
        type: 'special',
        data: {
          ...node.data,
          handles: {
            left: true,
            right: true
          }
        },
        style: nodeWithPosition.style,
        position: { x: xPos, y: yPos }
      };
    }

    return {
      ...node,
      style: nodeWithPosition.style,
      position: { x: xPos, y: yPos },
      targetPosition: nodeWithPosition.targetPosition,
      sourcePosition: nodeWithPosition.sourcePosition
    };
  });

  return { 
    nodes: layoutedNodes, 
    edges: edges.map(edge => {
      const isLeftBranch = leftChildren.has(edge.target);
      const isRootSource = edge.source === rootNode.id;
      
      return {
        ...edge,
        type: 'smoothstep',
        sourceHandle: isRootSource ? (isLeftBranch ? 'left' : 'right') : undefined,
        style: {
          ...edgeStyle,
          stroke: getNodeColor(edge.target, nodes, edges, rootNode),
          opacity: isRootSource ? 0.6 : 1
        }
      };
    })
  };
};

const MindMap = ({ nodes: initialNodes = [], edges: initialEdges = [] }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (initialNodes.length > 0) {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        initialNodes,
        initialEdges,
        'LR'
      );
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    }
  }, [initialNodes, initialEdges]);

  const onInit = useCallback((reactFlowInstance) => {
    console.log('Flow loaded:', reactFlowInstance);
    reactFlowInstance.fitView();
  }, []);

  return (
    <div style={flowStyles}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={onInit}
        fitView
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        nodeOrigin={[0.5, 0.5]}
        minZoom={0.2}
        maxZoom={2}
        fitViewOptions={{
          padding: 100,
          minZoom: 0.5,
          maxZoom: 1.2,
          duration: 800
        }}
        proOptions={{ hideAttribution: true }}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#b1b1b7', strokeWidth: 2 },
        }}
      >
        <Controls 
          position="bottom-right" 
          showInteractive={false}
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '5px',
            bottom: '70px', 
            right: '20px'   
          }}
        />
        <Background variant="dots" gap={12} size={1} color="#1a73e8" />
      </ReactFlow>
    </div>
  );
};

export default MindMap;
