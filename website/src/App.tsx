import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { CodeshineTheme } from './components/code/CodeshineTheme';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { DocsLayout } from './pages/docs/DocsLayout';
import { Introduction } from './pages/docs/Introduction';
import { Installation } from './pages/docs/Installation';
import { QuickStart } from './pages/docs/QuickStart';
import { Levels } from './pages/docs/Levels';
import { Structured } from './pages/docs/Structured';
import { ChildLoggers } from './pages/docs/ChildLoggers';
import { Transports } from './pages/docs/Transports';
import { Plugins } from './pages/docs/Plugins';
import { PluginsCore } from './pages/docs/PluginsCore';
import { PluginsOptional } from './pages/docs/PluginsOptional';
import { PluginsCustom } from './pages/docs/PluginsCustom';
import { API } from './pages/API';
import { Examples } from './pages/Examples';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      {
        path: 'docs',
        element: <DocsLayout />,
        children: [
          { index: true, element: <Introduction /> },
          { path: 'installation', element: <Installation /> },
          { path: 'quickstart', element: <QuickStart /> },
          { path: 'levels', element: <Levels /> },
          { path: 'structured', element: <Structured /> },
          { path: 'child-loggers', element: <ChildLoggers /> },
          { path: 'transports', element: <Transports /> },
          { path: 'plugins', element: <Plugins /> },
          { path: 'plugins/core', element: <PluginsCore /> },
          { path: 'plugins/optional', element: <PluginsOptional /> },
          { path: 'plugins/custom', element: <PluginsCustom /> },
        ],
      },
      { path: 'api', element: <API /> },
      { path: 'examples', element: <Examples /> },
    ],
  },
]);

export function App() {
  return (
    <ThemeProvider>
      <CodeshineTheme />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
