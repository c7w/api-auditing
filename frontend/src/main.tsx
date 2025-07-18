import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
// 移除默认CSS，使用Ant Design的样式
// import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
