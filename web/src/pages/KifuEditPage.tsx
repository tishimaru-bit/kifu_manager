import { Alert, Anchor, Button, Grid, Group, Loader, Paper, Select, Stack, Text, TextInput } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router'
import { MoveList } from '../components/MoveList'
import { PlyControls } from '../components/PlyControls'
import { ShogiBoard } from '../components/ShogiBoard'
import { useAuth } from '../hooks/useAuth'
import { useKifuEditor } from '../hooks/useKifuEditor'
import { fetchKifu, saveKifu } from '../hooks/useKifus'
import type { Side } from '../lib/kifu'

export function KifuEditPage() {
  const { id } = useParams()
  const auth = useAuth()
  const location = useLocation()

  if (auth.status === 'loading') return <Loader />
  if (!auth.user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (!id) return <KifuEditor />
  return <ExistingKifuEditor id={id} userId={auth.user.id} />
}

function ExistingKifuEditor({ id, userId }: { id: string; userId: string }) {
  // 編集中は自分の保存で画面が読み直されないよう、リアルタイム購読せず一度だけ読み込む
  const { data, isPending, error } = useQuery({
    queryKey: ['kifu-edit', id],
    queryFn: () => fetchKifu(id),
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
  })

  if (isPending) return <Loader />
  if (error) return <Alert color="red" title="棋譜を取得できません">{error.message}</Alert>
  if (data.record.owner !== userId) {
    return <Alert color="yellow" title="この棋譜は編集できません">作成者だけが編集できます。</Alert>
  }
  return <KifuEditor id={id} initialTitle={data.record.title} initialKif={data.kifText} />
}

type SaveStatus = { state: 'idle' | 'saving' | 'saved' } | { state: 'error'; message: string }

interface EditorProps {
  id?: string
  initialTitle?: string
  initialKif?: string
}

function KifuEditor({ id, initialTitle = '', initialKif }: EditorProps) {
  const editor = useKifuEditor(initialKif)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState(initialTitle)
  const [orientation, setOrientation] = useState<Side>('sente')
  const [status, setStatus] = useState<SaveStatus>({ state: 'idle' })
  const [saved, setSaved] = useState({ revision: editor.revision, title })

  const dirty = editor.revision !== saved.revision || title !== saved.title

  const save = async () => {
    const revision = editor.revision
    setStatus({ state: 'saving' })
    try {
      const result = await saveKifu(id, editor.record, title)
      setSaved({ revision, title })
      setStatus({ state: 'saved' })
      queryClient.invalidateQueries({ queryKey: ['kifus'] })
      if (!id) navigate(`/kifus/${result.id}/edit`, { replace: true })
    } catch (err) {
      setStatus({ state: 'error', message: err instanceof Error ? err.message : String(err) })
    }
  }

  // 既存の棋譜は、変更が止まってから1秒後に自動保存する
  const saveRef = useRef(save)
  useEffect(() => {
    saveRef.current = save
  })
  useEffect(() => {
    if (!id || !dirty) return
    const timer = setTimeout(() => saveRef.current(), 1000)
    return () => clearTimeout(timer)
  }, [id, dirty, editor.revision, title])

  const { header } = editor
  const wide = useMediaQuery('(min-width: 62em)')
  const touch = useMediaQuery('(pointer: coarse)')
  const buttonSize = touch ? 'sm' : 'xs'

  const headerFields = (
    <>
      <TextInput label="タイトル" placeholder="未入力なら「先手 対 後手」" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
      <Group grow>
        <TextInput label="先手" value={header.sente} onChange={(e) => editor.setHeader('sente', e.currentTarget.value)} />
        <TextInput label="後手" value={header.gote} onChange={(e) => editor.setHeader('gote', e.currentTarget.value)} />
      </Group>
    </>
  )

  return (
    <>
      {/* 保存状態が変わっても盤の位置がずれないよう、この行は折り返さず高さを固定する */}
      <Group justify="space-between" wrap="nowrap" mb="md">
        <Anchor component={Link} to={id ? `/kifus/${id}` : '/'} size="sm">
          ← {id ? '表示画面へ' : '棋譜一覧'}
        </Anchor>
        <Group gap="sm" wrap="nowrap">
          <SaveStatusText status={status} dirty={dirty} />
          <Button onClick={save} loading={status.state === 'saving'} disabled={!!id && !dirty}>
            {id ? '保存' : '作成して保存'}
          </Button>
        </Group>
      </Group>

      <Grid gap={{ base: 'md', md: 'xl' }}>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Stack gap="md">
            <ShogiBoard
              state={editor.board}
              orientation={orientation}
              senteName={header.sente || '先手'}
              goteName={header.gote || '後手'}
              onMove={editor.play}
            />
            <PlyControls
              ply={editor.ply}
              length={editor.length}
              current={editor.currentNode.displayText}
              onChange={editor.goto}
              onFlip={() => setOrientation((o) => (o === 'sente' ? 'gote' : 'sente'))}
            />
            <Group gap="xs" justify="center">
              <Button variant="light" color="red" size={buttonSize} onClick={editor.removeCurrentMove} disabled={editor.ply === 0}>
                この手以降を削除
              </Button>
              <Button variant="light" size={buttonSize} onClick={editor.resign}>
                投了
              </Button>
            </Group>
          </Stack>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          {/* 狭い画面では盤のすぐ下に指し手を置き、対局者などの入力欄は後ろに回す */}
          <Stack gap="sm">
            {wide && headerFields}
            <Paper withBorder>
              <MoveList moves={editor.moves} ply={editor.ply} onSelect={editor.goto} height={wide ? 360 : 200} />
            </Paper>
            {editor.branches.length > 1 && (
              <Select
                label="変化"
                allowDeselect={false}
                value={String(editor.branches.indexOf(editor.currentNode))}
                onChange={(v) => v !== null && editor.switchBranch(Number(v))}
                data={editor.branches.map((n, i) => ({ value: String(i), label: n.displayText }))}
              />
            )}
            {!wide && headerFields}
          </Stack>
        </Grid.Col>
      </Grid>
    </>
  )
}

function SaveStatusText({ status, dirty }: { status: SaveStatus; dirty: boolean }) {
  const text = (label: string, color: string, detail?: string) => (
    <Text size="xs" c={color} title={detail} style={{ whiteSpace: 'nowrap' }}>
      {label}
    </Text>
  )
  if (status.state === 'error') return text('保存失敗', 'red', status.message)
  if (status.state === 'saving') return text('保存中…', 'dimmed')
  if (dirty) return text('未保存', 'dimmed')
  if (status.state === 'saved') return text('保存済み', 'teal')
  return null
}
