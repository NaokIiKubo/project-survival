import { useGameStore } from '../../store/gameStore';
import type { MemberCard, Role } from '../../types';

const ROLE_LABELS: Record<Role, string> = {
  junior_se: '新人SE', se: 'SE', senior_se: 'シニアSE',
  pm: 'PM', playing_pm: 'プレイングPM', sales: '営業',
};

const ROLE_COLORS: Record<Role, string> = {
  junior_se: '#5DADE8', se: '#5DADE8', senior_se: '#2ECC71',
  pm: '#F5A623', playing_pm: '#F5A623', sales: '#AA44CC',
};

const StaminaDots = ({ current, max }: { current: number; max: number }) => (
  <div className="stamina-dots">
    {Array.from({ length: max }).map((_, i) => (
      <div key={i} className={`stamina-dot ${i < current ? 'full' : 'empty'}`} />
    ))}
  </div>
);

const SkillBar = ({ value, max = 5, color }: { value: number; max?: number; color: string }) => (
  <div className="progress-bar" style={{ flex: 1, height: 5 }}>
    <div
      className="progress-bar-fill"
      style={{ width: `${(value / max) * 100}%`, background: color }}
    />
  </div>
);

const MemberCardUI = ({ member, selected, onToggle }: {
  member: MemberCard;
  selected: boolean;
  onToggle: () => void;
}) => {
  const roleColor = ROLE_COLORS[member.role];

  return (
    <div
      className={`card ${selected ? 'selected' : ''}`}
      onClick={onToggle}
      style={{ cursor: 'pointer' }}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-8">
          <span style={{ fontSize: 22 }}>
            {member.role === 'pm' || member.role === 'playing_pm' ? '👔' :
             member.role === 'sales' ? '💼' : '💻'}
          </span>
          <div>
            <div className="text-bold">{member.name}</div>
            <span
              className="badge"
              style={{ background: roleColor + '33', color: roleColor, fontSize: 10 }}
            >
              {ROLE_LABELS[member.role]}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="text-yellow text-bold">コスト {member.cost}pt</div>
          <div className="text-small text-gray">年次{member.seniority} / Lv{member.level}</div>
        </div>
      </div>

      <div className="divider" />

      {/* スキル */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
        {[
          { label: 'アプリ技術', value: member.skills.appTech, color: 'var(--blue-light)' },
          { label: 'インフラ技術', value: member.skills.infraTech, color: 'var(--blue-light)' },
          { label: 'コミュ力', value: member.skills.communication, color: 'var(--green)' },
          { label: '資料力', value: member.skills.documentation, color: 'var(--green)' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-4">
            <div className="text-small text-gray" style={{ width: 60, flexShrink: 0 }}>{s.label}</div>
            <SkillBar value={s.value} color={s.color} />
            <div className="text-small text-bold" style={{ width: 14, textAlign: 'right' }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-8">
        <div className="flex items-center gap-8">
          <span className="text-small text-gray">稼働</span>
          <span className="text-bold text-yellow">{member.workCapacity}</span>
          <span className="text-small text-gray">体力</span>
          <StaminaDots current={member.stamina} max={member.maxStamina} />
        </div>
        {selected && <span className="text-green text-bold">✓ 選択中</span>}
      </div>

      <div className="mt-8" style={{
        background: 'var(--accent)', borderRadius: 6, padding: '6px 8px',
      }}>
        <div className="text-small text-yellow text-bold">⚡ {member.specialSkill.name}</div>
        <div className="text-small text-gray" style={{ marginTop: 2 }}>{member.specialSkill.description}</div>
      </div>
    </div>
  );
};

export const MemberSelectScreen = () => {
  const { collection, selectedMembers, projectConfig, toggleMemberSelection, confirmTeam, goHome } = useGameStore();

  const budget = projectConfig?.budget ?? 100;
  const usedBudget = selectedMembers.reduce((sum, m) => sum + m.cost, 0);
  const budgetRatio = usedBudget / budget;

  // 対策チェック
  const checks = [
    { label: 'コミュ力5', met: selectedMembers.reduce((s, m) => s + m.skills.communication, 0) >= 5 },
    { label: 'アプリ技術5', met: selectedMembers.reduce((s, m) => s + m.skills.appTech, 0) >= 5 },
    { label: '責任感のPM', met: selectedMembers.some(m => (m.role === 'pm' || m.role === 'playing_pm') && m.skills.responsibility >= 4) },
  ];

  return (
    <div className="app-container">
      <div className="screen-header">
        <button className="btn btn-ghost" style={{ padding: '6px 10px' }} onClick={goHome}>←</button>
        <h1>チーム編成</h1>
      </div>

      {/* 予算バー */}
      <div style={{ padding: '10px 12px', background: 'var(--bg-card)', borderBottom: '1px solid var(--accent)' }}>
        <div className="flex items-center justify-between mb-8">
          <span className="text-small text-gray">予算</span>
          <span className={`text-bold ${budgetRatio > 0.9 ? 'text-red' : 'text-yellow'}`}>
            {usedBudget} / {budget}pt
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-bar-fill"
            style={{
              width: `${Math.min(budgetRatio * 100, 100)}%`,
              background: budgetRatio > 0.9 ? 'var(--highlight)' : 'var(--yellow)',
            }}
          />
        </div>
      </div>

      {/* 選択メンバー表示 */}
      {selectedMembers.length > 0 && (
        <div style={{ padding: '8px 12px', background: 'var(--accent)' }}>
          <div className="section-title" style={{ marginBottom: 6 }}>選択中のチーム</div>
          <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
            {selectedMembers.map(m => (
              <div key={m.id} className="flex items-center gap-4"
                style={{ background: 'var(--bg-card)', borderRadius: 6, padding: '4px 8px' }}>
                <span>{m.name}</span>
                <span className="text-small text-gray">{m.cost}pt</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 対策チェック */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--accent)' }}>
        <div className="section-title">対策チェック</div>
        <div className="flex gap-8">
          {checks.map(c => (
            <span key={c.label} className="text-small" style={{ color: c.met ? 'var(--green)' : 'var(--gray-dark)' }}>
              {c.met ? '✅' : '❌'} {c.label}
            </span>
          ))}
        </div>
      </div>

      <div className="scroll-area">
        <div className="section-title">コレクション（{collection.length}人）</div>
        {collection.map(member => (
          <MemberCardUI
            key={member.id}
            member={member}
            selected={selectedMembers.some(m => m.id === member.id)}
            onToggle={() => toggleMemberSelection(member.id)}
          />
        ))}
      </div>

      {/* 確定ボタン */}
      <div style={{ padding: '12px', borderTop: '1px solid var(--accent)' }}>
        <button
          className="btn btn-success btn-full"
          disabled={selectedMembers.length === 0}
          onClick={confirmTeam}
        >
          {selectedMembers.length > 0
            ? `このチームでプロジェクト開始（${selectedMembers.length}人）`
            : 'メンバーを選んでください'}
        </button>
      </div>
    </div>
  );
};
