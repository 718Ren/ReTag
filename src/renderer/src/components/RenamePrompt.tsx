import { actions, renameRequests, useAppState } from '../store/appStore';

const EXAMPLE_COUNT = 3;

/**
 * ファイル名の先頭に共通の不要な部分を見つけた時に出す確認。
 * ファイル名の列を出していないので、実行するかどうかはここでしか選べない。
 * 「削除する」を押した時点で実行する（この確認が最後の関門）。
 */
export function RenamePrompt() {
  const state = useAppState();

  if (!state.renamePromptOpen) return null;

  const requests = renameRequests(state.tracks, state.renamePrefix);
  if (requests.length === 0) return null;

  const examples = requests.slice(0, EXAMPLE_COUNT).map((request) => ({
    before: request.path.split(/[\\/]/).pop() ?? request.path,
    after: request.newName,
  }));

  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-label="ファイル名の確認">
        <p className="modal-title">
          ファイル名の先頭に共通の文字列があります（{requests.length}件）
        </p>
        <p className="modal-prefix">{state.renamePrefix}</p>

        <ul className="rename-examples">
          {examples.map((example) => (
            <li key={example.before}>
              <span className="rename-before">{example.before}</span>
              <span className="rename-arrow">→</span>
              <span className="rename-after">{example.after}</span>
            </li>
          ))}
          {requests.length > EXAMPLE_COUNT && (
            <li className="rename-more">ほか {requests.length - EXAMPLE_COUNT} 件</li>
          )}
        </ul>

        <div className="modal-actions">
          <button type="button" onClick={() => actions.dismissRename()}>
            そのままにする
          </button>
          <button type="button" className="save-button" onClick={() => void actions.confirmRename()}>
            削除する
          </button>
        </div>
      </div>
    </div>
  );
}
