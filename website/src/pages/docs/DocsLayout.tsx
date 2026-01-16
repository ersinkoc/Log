import { Outlet } from 'react-router-dom';
import { DocsSidebar } from '../../components/docs/DocsSidebar';

export function DocsLayout() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex gap-12">
        <DocsSidebar />
        <article className="flex-1 min-w-0 prose prose-zinc dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-code:before:hidden prose-code:after:hidden prose-code:bg-zinc-100 dark:prose-code:bg-zinc-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
          <Outlet />
        </article>
      </div>
    </div>
  );
}
