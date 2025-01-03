import React, { useState } from 'react';
import MindMap from './components/MindMap';
import ModernHeader from './components/ModernHeader';
import './App.css';

function App() {
  const [inputText, setInputText] = useState('');
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [error, setError] = useState('');
  const [isInputExpanded, setIsInputExpanded] = useState(false);

  const handleGenerate = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Network response was not ok');
      }
      
      setNodes(data.nodes);
      setEdges(data.edges);
      setError('');
      setIsInputExpanded(false);
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    }
  };

  return (
    <div className="app">
      <ModernHeader />
      <div className="mindmap-container">
        <div className={`input-section ${isInputExpanded ? 'expanded' : ''}`}>
          <button 
            className="toggle-button"
            onClick={() => setIsInputExpanded(!isInputExpanded)}
          >
            {isInputExpanded ? '▼ پنهان کردن' : '▲ نمایش ورودی'}
          </button>
          <div className="content">
            <div className="file-upload-container">
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const formData = new FormData();
                    formData.append('image', file);
                    
                    try {
                      const response = await fetch('http://localhost:5000/api/extract-text', {
                        method: 'POST',
                        body: formData,
                      });
                      
                      const data = await response.json();
                      if (response.ok) {
                        setInputText(data.text);
                      } else {
                        setError(data.error || 'خطا در استخراج متن از تصویر');
                      }
                    } catch (error) {
                      console.error('Error:', error);
                      setError('خطا در ارتباط با سرور');
                    }
                  }
                }}
                className="hidden"
                id="image-upload"
              />
              <label 
                htmlFor="image-upload"
                className="paperclip-button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </label>
            </div>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="متن خود را اینجا وارد کنید..."
            />
            <button onClick={handleGenerate}>تولید نمودار</button>
            {error && <div className="error">{error}</div>}
          </div>
        </div>
        <MindMap nodes={nodes} edges={edges} />
      </div>
    </div>
  );
}

export default App;
