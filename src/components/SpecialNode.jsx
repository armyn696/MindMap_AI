import { Handle, Position } from 'reactflow';

function SpecialNode({ data, isConnectable }) {
  return (
    <div className="special-node">
      {/* Handle سمت چپ */}
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{ background: '#555', width: '8px', height: '8px' }}
        isConnectable={isConnectable}
      />
      
      {/* محتوای نود */}
      <div style={data.style}>{data.label}</div>
      
      {/* Handle سمت راست */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: '#555', width: '8px', height: '8px' }}
        isConnectable={isConnectable}
      />
    </div>
  );
}

export default SpecialNode;
