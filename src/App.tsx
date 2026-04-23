import Canvas from './components/Canvas'

function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '12px 24px', borderBottom: '1px solid #e5e7eb' }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>Slides Editor</h1>
      </header>
      <main style={{ flex: 1, overflow: 'hidden' }}>
        <Canvas />
      </main>
    </div>
  )
}

export default App
