import { Alert, Button, Paper, PasswordInput, Stack, TextInput, Title } from '@mantine/core'
import { type FormEvent, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { setAuthUser } from '../hooks/useAuth'
import { api, type AuthUser } from '../lib/api'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const user = await api<AuthUser>('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setAuthUser(user)
      navigate((location.state as { from?: string } | null)?.from ?? '/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Paper withBorder p="lg" maw={400} mx="auto" mt="xl">
      <form onSubmit={submit}>
        <Stack>
          <Title order={2}>ログイン</Title>
          <TextInput
            label="メールアドレス"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
          <PasswordInput
            label="パスワード"
            required
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
          {error && <Alert color="red">{error}</Alert>}
          <Button type="submit" loading={submitting}>
            ログイン
          </Button>
        </Stack>
      </form>
    </Paper>
  )
}
