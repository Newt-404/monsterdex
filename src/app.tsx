// Tab shell + tab bar (architecture §2). Hash-driven tab state, dark theme. The
// catalog + user state hydrate once on boot. Flavor detail pushes over the tab
// content (architecture §1); the custom-flavor editor floats above everything.

import { useEffect, useLayoutEffect, useRef } from 'preact/hooks';
import { activeTab, boot, customEditor, detailSlug } from './store/state';
import { TabBar } from './ui/tab-bar';
import { CanDefs } from './can/can-defs';
import { Catalog } from './views/catalog';
import { Dashboard } from './views/dashboard';
import { Profile } from './views/profile';
import { FlavorDetail } from './views/flavor-detail';
import { CustomForm } from './views/custom-form';
import './styles/app.css';

export function App() {
  useEffect(() => {
    void boot();
  }, []);

  const tab = activeTab.value;
  const detail = detailSlug.value;

  // The catalog and a pushed flavor-detail share one scroll container. Opening a
  // detail must show it from the top (not wherever the list was scrolled); closing
  // it restores the list to where you left off.
  const scrollRef = useRef<HTMLElement>(null);
  const listScroll = useRef(0);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = detail ? 0 : listScroll.current;
  }, [detail]);

  return (
    <div class="app-shell">
      <CanDefs />
      <main
        class="app-scroll no-scrollbar"
        ref={scrollRef}
        onScroll={() => {
          // Track the list scroll only while on a tab, so detail scrolling never
          // clobbers the position we restore to on close.
          if (!detailSlug.value) listScroll.current = scrollRef.current?.scrollTop ?? 0;
        }}
      >
        {detail ? (
          <FlavorDetail slug={detail} />
        ) : (
          <>
            {tab === 'catalog' ? <Catalog /> : null}
            {tab === 'dashboard' ? <Dashboard /> : null}
            {tab === 'profile' ? <Profile /> : null}
          </>
        )}
      </main>
      <TabBar />
      {customEditor.value ? <CustomForm /> : null}
    </div>
  );
}
