import { useEffect, useRef, useState } from 'react';

/* First settings surface. One job for now: get your data in and out.
   Everything is in localStorage, so "export" is the only backup there is. */

function countDays(data) {
  return Object.keys(data.days ?? {}).length;
}

function plural(n) {
  return n === 1 ? 'day' : 'days';
}

export default function Settings({ allData, onImport, onBack }) {
  const fileRef = useRef(null);
  const backRef = useRef(null);
  const [msg, setMsg] = useState(null); // { kind: 'ok' | 'err', text }

  // Land keyboard focus somewhere sensible on this screen.
  useEffect(() => {
    backRef.current?.focus();
  }, []);

  const dayCount = countDays(allData);

  const handleExport = () => {
    const json = JSON.stringify(allData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training-log-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // let the same file be picked again later
    if (!file) return;

    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      setMsg({ kind: 'err', text: "That file isn't valid JSON." });
      return;
    }
    if (!parsed || typeof parsed !== 'object' || typeof parsed.days !== 'object') {
      setMsg({ kind: 'err', text: "That doesn't look like a Training Log backup." });
      return;
    }

    const incoming = countDays(parsed);
    const ok = window.confirm(
      `Replace everything here (${dayCount} ${plural(dayCount)}) with this file ` +
        `(${incoming} ${plural(incoming)})? This can't be undone.`,
    );
    if (!ok) return;

    onImport(parsed);
    setMsg({ kind: 'ok', text: `Imported ${incoming} ${plural(incoming)}.` });
  };

  return (
    <div className="settings-screen">
      <button type="button" className="back-btn" ref={backRef} onClick={onBack}>
        &larr; Back
      </button>

      <p className="eyebrow">Training Log</p>
      <h1>Settings</h1>

      <section className="card">
        <h2>Your data</h2>
        <p className="sub">
          Everything lives in this browser. Export a copy to back it up, or to
          move it to another device.
        </p>

        <div className="settings-actions">
          <button type="button" className="ghost-btn" onClick={handleExport}>
            Export ({dayCount} {plural(dayCount)})
          </button>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => fileRef.current?.click()}
          >
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFile}
            hidden
          />
        </div>

        {msg && (
          <p
            className={'settings-msg ' + (msg.kind === 'err' ? 'is-err' : 'is-ok')}
            role="status"
          >
            {msg.text}
          </p>
        )}
      </section>

      <p className="footnote">
        Importing replaces what's here now — export first if you're unsure.
      </p>
    </div>
  );
}
