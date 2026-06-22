import { useEffect, useState } from 'react';
import type { MemberCard } from '../types';

interface MemberDialogueProps {
  memberId: string;
  text: string;
  members: MemberCard[];
  onDismiss: () => void;
}

const ROLE_ICONS: Record<string, string> = {
  pm: '👔', playing_pm: '👔', sales: '💼',
  junior_se: '💻', se: '💻', senior_se: '💻',
};

export const MemberDialogue = ({ memberId, text, members, onDismiss }: MemberDialogueProps) => {
  const [visible, setVisible] = useState(false);
  const member = members.find(m => m.id === memberId);

  useEffect(() => {
    // マウント後にフェードイン
    const t1 = setTimeout(() => setVisible(true), 20);
    // 4秒後に自動消去
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDismiss]);

  if (!member) return null;

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(onDismiss, 200); }}
      style={{
        position: 'fixed',
        bottom: 90,
        left: 12,
        right: 12,
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 10,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.25s ease, transform 0.25s ease',
        pointerEvents: 'auto',
        cursor: 'pointer',
      }}
    >
      {/* アバター */}
      <div style={{
        width: 44, height: 44, flexShrink: 0,
        borderRadius: '50%',
        background: 'var(--accent)',
        border: '2px solid var(--blue-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
      }}>
        {ROLE_ICONS[member.role] ?? '👤'}
      </div>

      {/* 吹き出し */}
      <div style={{
        flex: 1,
        background: 'rgba(24,26,38,0.97)',
        border: '1px solid var(--blue-light)',
        borderRadius: '12px 12px 12px 2px',
        padding: '8px 12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
      }}>
        <div style={{ fontSize: 10, color: 'var(--blue-light)', marginBottom: 3, fontWeight: 'bold' }}>
          {member.name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--white)', lineHeight: 1.5 }}>
          {text}
        </div>
      </div>
    </div>
  );
};
