import type { DragEvent } from 'react';
import { actions, useAppState } from '../store/appStore';

function baseName(filePath: string): string {
  const parts = filePath.split(/[\\/]/);
  return parts[parts.length - 1] ?? filePath;
}

function toMediaUrl(filePath: string): string {
  // file:// は開発時の http オリジンからブロックされるため、main 側の media:// 経由で読む
  return `media://local/${encodeURIComponent(filePath)}`;
}

export function ArtworkPanel() {
  const state = useAppState();

  function handleDrop(event: DragEvent<HTMLButtonElement>): void {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;

    const path = window.api.getDroppedFilePath(file);
    if (path) actions.selectImage(path);
  }

  return (
    <div className="artwork">
      <button
        type="button"
        aria-label="画像を選ぶ"
        className={state.pendingArtwork ? 'artwork-frame pending' : 'artwork-frame'}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        onClick={() => void actions.pickImage()}
      >
        {state.selectedImage ? (
          <img src={toMediaUrl(state.selectedImage)} alt="アートワーク候補" />
        ) : (
          <p>クリックで選択またはドロップ</p>
        )}
      </button>

      {state.imageFiles.length > 1 && (
        <div className="artwork-choices">
          {state.imageFiles.map((imagePath) => (
            <button
              key={imagePath}
              type="button"
              className={imagePath === state.selectedImage ? 'current' : undefined}
              onClick={() => actions.selectImage(imagePath)}
            >
              {baseName(imagePath)}
            </button>
          ))}
        </div>
      )}

      {state.pendingArtwork && <p className="artwork-note">保存で選択中の曲に適用されます</p>}
    </div>
  );
}
