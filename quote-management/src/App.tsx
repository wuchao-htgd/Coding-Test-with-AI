// src/App.tsx
import React from 'react';
import QuoteTable from './components/QuoteTable';
import 'antd/dist/reset.css'; // Ant Design 样式重置（确保样式正常）

function App() {
  return (
    <div className="App" style={{ padding: 24, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <QuoteTable />
    </div>
  );
}

export default App;