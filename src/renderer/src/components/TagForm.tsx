import { useEffect } from 'react';
import { actions, useAppState } from '../store/appStore';
import { ArtworkPanel } from './ArtworkPanel';
import {
  commonFieldValues,
  MULTIPLE_VALUES,
  type EditableField,
  type FormState,
} from '../store/editing';
import { isEditableTarget } from '../store/saveResults';

const LABELS: Record<EditableField, string> = {
  title: 'Title',
  artist: 'Artist',
  album: 'Album',
  albumArtist: 'Album Artist',
  trackNumber: 'Track#',
  trackCount: 'Track Count',
  discNumber: 'Disc#',
  discCount: 'Disc Count',
  year: 'Year',
  genre: 'Genre',
};

/** 横一列に並べる数値欄。Disc# と Disc Count で「1 / 2」を作る */
const NUMBER_GROUPS: { label: string; fields: EditableField[] }[] = [
  { label: 'Disc', fields: ['discNumber', 'discCount'] },
  { label: 'Track', fields: ['trackNumber', 'trackCount'] },
  { label: 'Year', fields: ['year'] },
];

const TEXT_FIELDS: EditableField[] = ['title', 'artist', 'album', 'albumArtist'];

export function TagForm() {
  const state = useAppState();
  const selected = state.tracks.filter((track) => state.selectedPaths.includes(track.path));

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      const key = event.key.toLowerCase();

      if (event.ctrlKey && key === 's') {
        event.preventDefault();
        void actions.save();
        return;
      }

      // 入力欄での Ctrl+A は文字選択として通す
      if (event.ctrlKey && key === 'a' && !isEditableTarget(event.target as { tagName?: string })) {
        event.preventDefault();
        actions.selectAllTracks();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const form: FormState = commonFieldValues(selected);

  const disabled = selected.length === 0;

  const fieldProps = (field: EditableField) => ({
    'aria-label': LABELS[field],
    value: state.touched[field] ?? form.values[field],
    placeholder: form.mixed[field] ? MULTIPLE_VALUES : '',
    disabled,
    onChange: (event: { target: { value: string } }) => actions.setField(field, event.target.value),
  });

  return (
    <section className="tag-form">
      <div className="tag-form-body">
        <ArtworkPanel />

        <div className="fields">
            <div className="number-row">
              {NUMBER_GROUPS.map((group) => (
                <div key={group.label} className="number-group">
                  <span className="number-label">{group.label}</span>
                  {group.fields.map((field, index) => (
                    <span key={field} className="number-cell">
                      {index > 0 && <span className="number-separator">/</span>}
                      <input
                        className={field === 'year' ? 'number-input year' : 'number-input'}
                        maxLength={field === 'year' ? 4 : 2}
                        {...fieldProps(field)}
                      />
                    </span>
                  ))}
                </div>
              ))}
            </div>

          {TEXT_FIELDS.map((field) => (
            <label key={field} className="text-field">
              <span>{LABELS[field]}</span>
              <input {...fieldProps(field)} />
            </label>
          ))}

          {/* 最終行は Genre と保存操作を同居させる。行を増やさずに済む */}
          <div className="text-field genre-row">
            <span>{LABELS.genre}</span>
            <input {...fieldProps('genre')} />
            <span className="selection-count">
              {state.status ||
                (selected.length > 0 ? `${selected.length}曲を編集中` : '曲を選んでください')}
            </span>
            <button
              type="button"
              className="save-button"
              disabled={selected.length === 0}
              onClick={() => void actions.save()}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
