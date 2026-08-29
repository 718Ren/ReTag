import { actions, useAppState } from '../store/appStore';
import { buildSearchTree, isExpanded } from '../store/tree';

function baseName(dirPath: string): string {
  const parts = dirPath.split(/[\\/]/).filter((part) => part.length > 0);
  return parts[parts.length - 1] ?? dirPath;
}

function TreeNode({ dir }: { dir: string }) {
  const state = useAppState();
  const name = baseName(dir);
  const children = state.childDirs[dir];
  const open = isExpanded(state.expanded, dir);
  // 読み込み済みならその事実が最優先。未読み込みなら childFlags の結果を使い、
  // まだ判明していないフォルダには三角を出さない。出しておいて後から消えると
  // アイコンが勝手に消えたように見えるため、出す方向にだけ変化させる。
  const hasChildren =
    children !== undefined ? children.length > 0 : (state.dirHasChildren[dir] ?? false);

  return (
    <li>
      <div className={state.currentDir === dir ? 'tree-row current' : 'tree-row'}>
        {hasChildren ? (
          <button
            type="button"
            className="tree-toggle"
            aria-label={`${name} を${open ? '閉じる' : '開く'}`}
            onClick={() => void actions.toggleDir(dir)}
          >
            {open ? '▾' : '▸'}
          </button>
        ) : (
          <span className="tree-toggle tree-toggle-empty" />
        )}
        <button type="button" className="tree-name" onClick={() => void actions.activateDir(dir)}>
          {name}
        </button>
      </div>
      {open && children && children.length > 0 && (
        <ul>
          {children.map((child) => (
            <TreeNode key={child} dir={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * 検索結果。通常のツリーと同じ形で、一致したフォルダまでの親をたどって描く。
 * 一致そのものは太字にして、経路として通っているだけのフォルダと区別する。
 */
function SearchNode({
  dir,
  tree,
  matches,
}: {
  dir: string;
  tree: Record<string, string[]>;
  matches: string[];
}) {
  const state = useAppState();
  const children = tree[dir] ?? [];
  const isMatch = matches.includes(dir);
  const name = baseName(dir);
  const open = !state.searchCollapsed.includes(dir);

  return (
    <li>
      <div className={state.currentDir === dir ? 'tree-row current' : 'tree-row'}>
        {children.length > 0 ? (
          <button
            type="button"
            className="tree-toggle"
            aria-label={`${name} を${open ? '閉じる' : '開く'}`}
            onClick={() => actions.toggleSearchNode(dir)}
          >
            {open ? '▾' : '▸'}
          </button>
        ) : (
          <span className="tree-toggle tree-toggle-empty" />
        )}
        <button
          type="button"
          className={isMatch ? 'tree-name hit' : 'tree-name'}
          onClick={() => void actions.selectDir(dir)}
        >
          {name}
        </button>
      </div>
      {open && children.length > 0 && (
        <ul>
          {children.map((child) => (
            <SearchNode key={child} dir={child} tree={tree} matches={matches} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function DirectoryTree() {
  const state = useAppState();
  const root = state.roots[0];

  return (
    <nav className="pane pane-left">
      <button type="button" className="open-folder" onClick={() => void actions.openFolder()}>
        フォルダを開く
      </button>
      <input
        className="tree-search"
        aria-label="フォルダを検索"
        value={state.treeQuery}
        onChange={(event) => actions.setTreeQuery(event.target.value)}
      />
      {state.rootError && <p className="tree-error">{state.rootError}</p>}

      {state.searchResults ? (
        state.searchResults.length === 0 || root === undefined ? (
          <p className="tree-empty">一致するフォルダがありません</p>
        ) : (
          <ul className="tree">
            <SearchNode
              dir={root}
              tree={buildSearchTree(root, state.searchResults)}
              matches={state.searchResults}
            />
          </ul>
        )
      ) : (
        <ul className="tree">
          {state.roots.map((dir) => (
            <TreeNode key={dir} dir={dir} />
          ))}
        </ul>
      )}
    </nav>
  );
}
