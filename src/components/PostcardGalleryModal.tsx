import React, { useState } from 'react';
import { BookHeart, Lock, RotateCw, X } from 'lucide-react';
import { QIONG_CONFIG } from '../config/qiongConfig';
import { PostcardArt } from './FallbackArt';

interface PostcardGalleryModalProps {
  open: boolean;
  unlockedIds: number[];
  onClose: () => void;
}

export const PostcardGalleryModal: React.FC<PostcardGalleryModalProps> = ({
  open,
  unlockedIds,
  onClose,
}) => {
  const [flippedId, setFlippedId] = useState<number | null>(null);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[85vh] rounded-3xl glass-panel flex flex-col overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <BookHeart className="w-5 h-5 text-petal-pink" />
            <div>
              <h2 className="text-base font-display font-semibold">
                {QIONG_CONFIG.playerName}的星海画册
              </h2>
              <p className="text-[11px] text-starlight-300/80">
                每通关 10 关解锁一张纪念明信片，点击已解锁卡片可翻转查看祝福与兑换券
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭画册"
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-starlight-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="starlight-scroll p-5 space-y-4">
          {QIONG_CONFIG.postcards.map((card) => {
            const isUnlocked = unlockedIds.includes(card.id);
            const isFlipped = isUnlocked && flippedId === card.id;

            return (
              <div
                key={card.id}
                onClick={() => {
                  if (isUnlocked) {
                    setFlippedId(isFlipped ? null : card.id);
                  }
                }}
                className={`rounded-2xl overflow-hidden border transition ${
                  isUnlocked
                    ? 'border-petal-pink/45 cursor-pointer hover:border-petal-gold/70 shadow-glow'
                    : 'border-white/10 opacity-80'
                }`}
              >
                {!isFlipped ? (
                  <div className="relative h-44 bg-starlight-900">
                    <div className={isUnlocked ? 'w-full h-full' : 'w-full h-full blur-[2px] opacity-55'}>
                      <PostcardArt postcard={card} locked={!isUnlocked} />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-starlight-950/90 via-transparent to-transparent p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-black/40 border border-white/15">
                          {card.chapterName}
                        </span>
                        {isUnlocked ? (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-petal-pink/30 text-petal-pink flex items-center gap-1">
                            <RotateCw className="w-3 h-3" />
                            轻点翻转
                          </span>
                        ) : (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-black/50 text-starlight-300 flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            第 {card.unlockLevel} 关解锁
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-display text-base font-semibold">{card.title}</div>
                        <div className="text-xs text-starlight-200/80">{card.subtitle}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-44 p-4 bg-gradient-to-br from-starlight-800/95 to-starlight-950/95 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-petal-gold mb-1.5">
                        <span>{card.dateLabel}</span>
                        <span className="flex items-center gap-1 text-starlight-300">
                          <RotateCw className="w-3 h-3" />
                          翻回正面
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-starlight-100">{card.blessing}</p>
                    </div>
                    <div className="rounded-xl bg-petal-pink/15 border border-petal-pink/35 px-3 py-2">
                      <div className="text-xs font-semibold text-petal-gold">{card.voucherTitle}</div>
                      <div className="text-[11px] text-starlight-200/90 mt-0.5">
                        {card.voucherDetail}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
