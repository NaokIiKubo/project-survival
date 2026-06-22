import { useGameStore } from '../../store/gameStore';
import { PROJECT_CONFIGS } from '../../data/projects';
import type { ProjectType } from '../../types';

const DIFFICULTY_LABELS = ['', '★☆☆☆☆', '★★☆☆☆', '★★★☆☆', '★★★★☆', '★★★★★'];
const PROJECT_ICONS: Record<ProjectType, string> = {
  app_development: '🖥',
  infra_release: '🖧',
  system_migration: '🔄',
};

export const HomeScreen = () => {
  const { collection, selectProject, goCollection } = useGameStore();

  return (
    <div className="app-container">
      <div className="screen-header">
        <h1>🎮 PROJECT SURVIVAL</h1>
      </div>

      <div className="scroll-area">
        {/* コレクション */}
        <div className="card" style={{ cursor: 'pointer' }} onClick={goCollection}>
          <div className="flex items-center justify-between">
            <span className="text-bold">コレクション</span>
            <div className="flex items-center gap-8">
              <span className="badge text-blue" style={{ background: '#0F3D66' }}>
                保有: {collection.length}人
              </span>
              <span style={{ fontSize: 12, color: 'var(--blue-light)' }}>一覧 →</span>
            </div>
          </div>
          <div className="divider" />
          <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
            {collection.slice(0, 6).map(m => (
              <div key={m.id} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, marginBottom: 2,
                }}>
                  {m.role === 'pm' || m.role === 'playing_pm' ? '👔' : m.role === 'sales' ? '💼' : '💻'}
                </div>
                <div className="text-small text-gray">{m.name.slice(0, 3)}</div>
              </div>
            ))}
            {collection.length > 6 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 8,
                  background: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--gray)',
                }}>
                  +{collection.length - 6}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* プロジェクト選択 */}
        <div className="section-title">プロジェクトを選択</div>

        {PROJECT_CONFIGS.map(proj => (
          <button
            key={proj.type}
            className="card btn-full"
            style={{ textAlign: 'left', cursor: 'pointer', border: '1px solid var(--accent)' }}
            onClick={() => selectProject(proj.type)}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-8">
                <span style={{ fontSize: 24 }}>{PROJECT_ICONS[proj.type]}</span>
                <span className="text-bold" style={{ fontSize: 15 }}>{proj.name}</span>
              </div>
              <div className="difficulty-stars">{DIFFICULTY_LABELS[proj.difficulty]}</div>
            </div>
            <div className="text-small text-gray">{proj.description}</div>
            <div className="flex gap-8 mt-8">
              <span className="badge text-blue" style={{ background: '#0F2040' }}>
                {proj.totalTurns}ターン
              </span>
              <span className="badge text-yellow" style={{ background: '#2A1800' }}>
                予算 {proj.budget}pt
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
