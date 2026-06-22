export type DialogueContext = 'phase_complete' | 'event_handled' | 'event_failed' | 'event_positive';

// memberId → context → セリフ候補（ランダム選択）
export const MEMBER_DIALOGUES: Record<string, Record<DialogueContext, string[]>> = {
  m_hayashi: {
    phase_complete: [
      '想定通りです。次のフェーズも気を抜かずに。',
      'ここまでは順調ですね。でも最後まで油断しないように。',
      'チームの皆さん、お疲れ様でした。次も頼みます。',
    ],
    event_handled: [
      'このくらいのことは想定内です。',
      '問題ありません。引き続きお願いします。',
      '私が責任を持って対処しました。',
    ],
    event_failed: [
      '…申し訳ありません。私の管理が甘かったです。',
      '想定外でしたが、チームで乗り越えましょう。',
      'これは私の責任です。挽回します。',
    ],
    event_positive: [
      'いい兆候ですね。この調子で進めましょう。',
      'こういう時こそ、さらに加速できます。',
    ],
  },
  m_morita: {
    phase_complete: [
      '終わりましたね。正直きつかったです。',
      '次もガンガン行きましょう。疲れてるけど。',
      'やっと一区切り。ちょっと休憩していいですか。',
    ],
    event_handled: [
      '対処しました。でも疲れてきてます。',
      'これくらいなら問題ないですよ。',
      'ぎりぎりでしたが何とかなりました。',
    ],
    event_failed: [
      'まずいっすね…ちょっと無理かも。',
      '体力的に限界が見えてきました。',
      'すみません、もっと早く動くべきでした。',
    ],
    event_positive: [
      'ナイスです！こういうの大事。',
      'こういう日は残業しても惜しくないです！',
    ],
  },
  m_inoue: {
    phase_complete: [
      '…全部ドキュメントに記録しました。',
      '次のフェーズの仕様書、もう半分書いてます。',
      '（静かに頷く）',
    ],
    event_handled: [
      '対処方法はすでに手順書に残してあります。',
      'こういうのは事前に想定済みでした。',
      '…準備しておいた甲斐がありました。',
    ],
    event_failed: [
      '…次は必ず対処できる準備をします。',
      'ドキュメントに記録しておきます。',
      '…反省します。',
    ],
    event_positive: [
      '（小さく頷く）',
      'これも記録しておきます。',
    ],
  },
  m_yoshida: {
    phase_complete: [
      'みんな最高！このチームすごいですよ！',
      'フェーズ完了！お客さんへの報告が楽しみです！',
      'やったー！みんなお疲れ様！！',
    ],
    event_handled: [
      'うまく言いくるめましたよ〜！',
      '私に任せてください、こういうの得意なので！',
      'よかった〜！ひやひやしました！',
    ],
    event_failed: [
      'すみません、力不足でした…次は何とかします！',
      'ちょっと難しかった…でも諦めませんよ！',
      'うう…もっと頑張ります！',
    ],
    event_positive: [
      'ラッキー！こういう日は前向きに行きましょう！',
      'やった！この勢いで次も頑張りましょう！',
    ],
  },
  m_takahashi: {
    phase_complete: [
      'ふん、当然だな。俺が管理してるんだから。',
      'まあ、予定通りだ。次も同じようにやれ。',
      '予想の範囲内だ。油断するなよ。',
    ],
    event_handled: [
      '俺が全部把握してる。心配するな。',
      'この程度なら問題ない。俺に任せろ。',
      '…想定内だ。',
    ],
    event_failed: [
      'チッ…後でまとめて対処する。',
      '俺の計算では問題ない範囲だ。',
      '…次は俺が直接動く。',
    ],
    event_positive: [
      '…たまにはこういうこともある。',
      'まあ、当然だ。',
    ],
  },
  m_kawakami: {
    phase_complete: [
      'よしよし。わしの若い頃もこんなもんじゃったな。',
      'まあ当然の結果じゃな。プロとしての仕事じゃ。',
      'うむ。昔はもっと大変じゃったがね。',
    ],
    event_handled: [
      'さすがわしが目をかけたチームじゃ。',
      'うむ、問題なし。昔はこれくらいは当たり前じゃったが。',
      'わしが口出しせんでも大丈夫なようじゃな。',
    ],
    event_failed: [
      'まあ、しょうがない。昔はもっと理不尽なことが多かったぞ。',
      'わしの若い頃は自腹で解決してたもんじゃが。',
      '…まあ人間ミスはするもんじゃ。',
    ],
    event_positive: [
      'ほほう、これは運がいいな。',
      'わしが若い頃もこういうラッキーがあってな。',
    ],
  },
  m_sato: {
    phase_complete: [
      'あ、終わったんですね。',
      '…そうですか。',
      'お疲れ様でした。',
    ],
    event_handled: [
      'できましたよ、一応。',
      'まあ何とかなりました。',
      '…よかったです。',
    ],
    event_failed: [
      '…まあそういうこともありますよね。',
      'ちょっとミスりました。',
      '…はい。',
    ],
    event_positive: [
      'なんかラッキーでした。',
      '…いいことありましたね。',
    ],
  },
  m_nakamura: {
    phase_complete: [
      'すごい！終わりましたね！！',
      'やった！！みんなありがとうございます！',
      'わあ〜！感動してます！！',
    ],
    event_handled: [
      '本当ですか？！よかったです！',
      '頑張った甲斐がありました！',
      'やった！自分も少し役に立てたかな…！',
    ],
    event_failed: [
      'えっ…すみません、役に立てなくて…',
      '次こそは…！絶対頑張ります！',
      '…もっとスキル上げます。',
    ],
    event_positive: [
      'わあ！ラッキーですね！！',
      'こういうの初めて見ました！すごい！',
    ],
  },
  m_miyazaki: {
    phase_complete: [
      'いやあ、クライアントにも評判いいですよ！',
      'こういうの好きです！仕事した感あるし！',
      'これ実績に書いていいですか？',
    ],
    event_handled: [
      '顧客側ならお任せを！',
      '私のコネで何とかなりますよ！',
      'こういうの、営業の出番ですよね！',
    ],
    event_failed: [
      'そうですね〜、まあ仕方ないですよね？',
      'でも次の案件取ってきますから！',
      '大丈夫です！挽回の機会は必ずあります！',
    ],
    event_positive: [
      'これを活かして、追加提案しましょうか？！',
      'ナイス！こういう波に乗るの得意ですよ〜！',
    ],
  },
};

export const pickDialogue = (
  memberIds: string[],
  context: DialogueContext,
): { memberId: string; text: string } | null => {
  const candidates = memberIds.filter(id => MEMBER_DIALOGUES[id]?.[context]);
  if (candidates.length === 0) return null;
  const memberId = candidates[Math.floor(Math.random() * candidates.length)];
  const lines = MEMBER_DIALOGUES[memberId][context];
  const text = lines[Math.floor(Math.random() * lines.length)];
  return { memberId, text };
};
