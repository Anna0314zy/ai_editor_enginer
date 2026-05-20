import { NavLink, useNavigate } from 'react-router-dom';
import type { Engine } from '../../engine';
import { useStores, useHistoryStore } from '../../store';

// ============================================================================
// VideoHeader - 视频编辑页顶部菜单栏
// 左：Logo + 路由切换 / 中：项目标题 / 右：撤销重做 + 导出
// ============================================================================

interface VideoHeaderProps {
  engine: Engine;
}

export default function VideoHeader({ engine: _engine }: VideoHeaderProps) {
  const { historyStore } = useStores();
  const historySnapshot = useHistoryStore(historyStore);
  const navigate = useNavigate();

  return (
    <header className="h-12 flex items-center justify-between px-4 border-b border-gray-800 bg-gray-950 shrink-0">
      {/* 左：Logo + 路由切换 */}
      <div className="flex items-center gap-4">
        <h1 className="m-0 text-sm font-semibold text-gray-100">AI Editor</h1>
        <nav className="flex items-center gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `px-3 py-1 text-xs rounded ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
              }`
            }
          >
            PPT 编辑
          </NavLink>
          <NavLink
            to="/video"
            className={({ isActive }) =>
              `px-3 py-1 text-xs rounded ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
              }`
            }
          >
            音视频编辑
          </NavLink>
        </nav>
      </div>

      {/* 中：项目标题占位 */}
      <div className="flex-1 flex justify-center">
        <span className="text-xs text-gray-400">未命名项目</span>
      </div>

      {/* 右：撤销重做 / 导出 */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => historySnapshot.canUndo && historyStore.undo()}
          disabled={!historySnapshot.canUndo}
          className={`px-2.5 py-1 text-xs rounded border ${
            historySnapshot.canUndo
              ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700 cursor-pointer'
              : 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed'
          }`}
        >
          撤销
        </button>
        <button
          type="button"
          onClick={() => historySnapshot.canRedo && historyStore.redo()}
          disabled={!historySnapshot.canRedo}
          className={`px-2.5 py-1 text-xs rounded border ${
            historySnapshot.canRedo
              ? 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700 cursor-pointer'
              : 'bg-gray-900 border-gray-800 text-gray-600 cursor-not-allowed'
          }`}
        >
          重做
        </button>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-2.5 py-1 text-xs rounded border border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700 cursor-pointer"
        >
          返回
        </button>
        <button
          type="button"
          onClick={() => alert('导出功能即将上线')}
          className="px-3 py-1 text-xs rounded bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer"
        >
          导出
        </button>
      </div>
    </header>
  );
}
