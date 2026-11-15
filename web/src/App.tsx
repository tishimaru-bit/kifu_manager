import { Anchor, AppShell, Button, Container, Group, Loader, Text, Title } from '@mantine/core'
import { createBrowserRouter, Link, Navigate, Outlet, RouterProvider, useLocation } from 'react-router'
import { logout, useAuth } from './hooks/useAuth'
import { AboutPage, SOURCE_URL } from './pages/AboutPage'
import { KifuEditPage } from './pages/KifuEditPage'
import { KifuListPage } from './pages/KifuListPage'
import { KifuViewPage } from './pages/KifuViewPage'
import { LoginPage } from './pages/LoginPage'

function Layout() {
  const auth = useAuth()
  const user = auth.status === 'ready' ? auth.user : null

  return (
    <AppShell header={{ height: 56 }} padding={{ base: 'xs', sm: 'md' }}>
      <AppShell.Header>
        <Container size="lg" h="100%" px={{ base: 'xs', sm: 'md' }}>
          <Group h="100%" justify="space-between">
            <Anchor component={Link} to="/" underline="never" c="inherit">
              <Title order={3}>将棋棋譜帳</Title>
            </Anchor>
            <Group gap="sm">
              {user ? (
                <>
                  <Button component={Link} to="/kifus/new" size="xs">
                    新規棋譜
                  </Button>
                  <Text size="sm" c="dimmed" visibleFrom="sm">
                    {user.email}
                  </Text>
                  <Button variant="subtle" size="xs" onClick={() => void logout()}>
                    ログアウト
                  </Button>
                </>
              ) : (
                <Button component={Link} to="/login" variant="default" size="xs">
                  ログイン
                </Button>
              )}
            </Group>
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="lg" px={{ base: 0, sm: 'md' }}>
          <Outlet />
          <Group gap="md" mt="xl" px={{ base: 'xs', sm: 0 }}>
            <Anchor href={SOURCE_URL} size="xs" c="dimmed">
              ソースコード（GPL-3.0）
            </Anchor>
            <Anchor component={Link} to="/about" size="xs" c="dimmed">
              ライセンス・クレジット
            </Anchor>
          </Group>
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}

function RequireAuth() {
  const auth = useAuth()
  const location = useLocation()
  if (auth.status === 'loading') return <Loader mt="md" />
  if (!auth.user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  return <Outlet />
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/', element: <KifuListPage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: '/kifus/new', element: <KifuEditPage /> },
          { path: '/kifus/:id/edit', element: <KifuEditPage /> },
        ],
      },
      { path: '/kifus/:id', element: <KifuViewPage /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
