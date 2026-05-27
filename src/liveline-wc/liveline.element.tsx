import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Liveline } from 'liveline';
import type { LivelinePoint } from 'liveline';

// ── Wrapper React ────────────────────────────────────────
function LivelineWrapper({
  color,
  hostRef,
}: {
  color: string;
  hostRef: React.MutableRefObject<((p: LivelinePoint) => void) | null>;
}) {
  const [data,  setData]  = useState<LivelinePoint[]>([]);
  const [value, setValue] = useState(0);

  // Expone pushPoint al host (Angular lo llama desde afuera)
  useEffect(() => {
    hostRef.current = (point: LivelinePoint) => {
      setData(prev => [...prev.slice(-600), point]);
      setValue(point.value);
    };
    return () => { hostRef.current = null; };
  }, []);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <Liveline
        data={data}
        value={value}
        color={color}
        theme="light"
        fill
        pulse
        scrub
        exaggerate
        badge
        badgeVariant="minimal"
        windows={[
          { label: '1m',  secs: 60  },
          { label: '5m',  secs: 300 },
          { label: '15m', secs: 900 },
        ]}
        windowStyle="rounded"
        formatValue={v => `${Math.round(v)} usuarios`}
      />
    </div>
  );
}

// ── Custom Element ───────────────────────────────────────
class LivelineElement extends HTMLElement {
  private _root:      ReturnType<typeof createRoot> | null = null;
  private _pushRef:   React.MutableRefObject<((p: LivelinePoint) => void) | null> = { current: null };

  // Angular llamará este método para enviar puntos
  pushPoint(point: LivelinePoint) {
    this._pushRef.current?.(point);
  }

  connectedCallback() {
    const color = this.getAttribute('color') ?? '#2366CE';
    this.style.display = 'block';
    this.style.height  = this.getAttribute('height') ?? '200px';

    this._root = createRoot(this);
    this._root.render(
      <LivelineWrapper color={color} hostRef={this._pushRef} />
    );
  }

  disconnectedCallback() {
    this._root?.unmount();
    this._root = null;
  }
}

if (!customElements.get('liveline-wc')) {
  customElements.define('liveline-wc', LivelineElement);
}