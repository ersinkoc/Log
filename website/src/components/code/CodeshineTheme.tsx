import { useEffect } from 'react';
import { injectThemeStyles, removeThemeStyles, githubDark } from '@oxog/codeshine';

export function CodeshineTheme() {
  useEffect(() => {
    // Inject the GitHub Dark theme CSS
    injectThemeStyles(githubDark, { id: 'codeshine-theme' });

    return () => {
      // Cleanup on unmount
      removeThemeStyles(githubDark.name);
    };
  }, []);

  return null;
}
