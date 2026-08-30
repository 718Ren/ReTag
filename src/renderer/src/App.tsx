import { useEffect } from 'react';
import { DirectoryTree } from './components/DirectoryTree';
import { TitleBar } from './components/TitleBar';
import { TrackTable } from './components/TrackTable';
import { TagForm } from './components/TagForm';
import { RenamePrompt } from './components/RenamePrompt';
import { useDragResize } from './components/useDragResize';
import { actions, useAppState } from './store/appStore';
import './styles.css';

export function App() {
  const state = useAppState();
  const startDrag = useDragResize((width) => actions.setPaneWidth(width));

  useEffect(() => {
    void actions.init();
  }, []);

  // 1文字ごとに全階層を歩くと重いので、入力が止まってから探す
  useEffect(() => {
    const timer = setTimeout(() => void actions.runSearch(), 250);
    return () => clearTimeout(timer);
  }, [state.treeQuery]);

  return (
    <div className="app">
      <TitleBar />
      <div className="layout" style={{ gridTemplateColumns: `${state.layout.paneWidth}px 6px 1fr` }}>
        <DirectoryTree />
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="左ペインの幅を変更"
          className="pane-grip"
          onPointerDown={(event) => startDrag(event, state.layout.paneWidth)}
        />
        <main className="pane pane-right">
          <TrackTable />
          <TagForm />
        </main>
        <RenamePrompt />
      </div>
    </div>
  );
}
