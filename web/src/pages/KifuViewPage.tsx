import { ActionIcon, Alert, Anchor, Button, Grid, Group, Loader, Menu, Modal, Paper, SegmentedControl, Stack, Text, Title } from '@mantine/core'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { MoveList } from '../components/MoveList'
import { PlyControls } from '../components/PlyControls'
import { ShogiBoard } from '../components/ShogiBoard'
import { useAuth } from '../hooks/useAuth'
import { deleteKifu, useKifu } from '../hooks/useKifus'
import { useKifuPlayback } from '../hooks/useKifuPlayback'
import { useKifuPlayer } from '../hooks/useKifuPlayer'
import { useRefreshInterval, type RefreshInterval } from '../hooks/useRefreshInterval'
import { downloadKif } from '../lib/kifFile'
import type { Side } from '../lib/kifu'
import type { KifuRecord } from '../lib/api'

export function KifuViewPage() {
  const { id = '' } = useParams()
  const [interval, setInterval] = useRefreshInterval()
  const { data, isPending, error } = useKifu(id, interval)

  return (
    <>
      <Anchor component={Link} to="/" size="sm">
        ← 棋譜一覧
      </Anchor>
      {isPending && <Loader mt="md" />}
      {error && (
        <Alert color="red" title="棋譜を取得できません" mt="md">
          {error.message}
        </Alert>
      )}
      {data && <KifuViewer record={data.record} kifText={data.kifText} interval={interval} onInterval={setInterval} />}
    </>
  )
}

function KifuViewer({
  record,
  kifText,
  interval,
  onInterval,
}: {
  record: KifuRecord
  kifText: string
  interval: RefreshInterval
  onInterval: (interval: RefreshInterval) => void
}) {
  const player = useKifuPlayer(kifText)
  const playback = useKifuPlayback(player.ply, player.length, player.goto)
  const auth = useAuth()
  const user = auth.status === 'ready' ? auth.user : null
  const [orientation, setOrientation] = useState<Side>('sente')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const remove = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteKifu(record.id)
      await queryClient.invalidateQueries({ queryKey: ['kifus'] })
      navigate('/')
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : String(err))
      setDeleting(false)
    }
  }

  return (
    <>
      <Group justify="space-between" mt="xs">
        <Title order={2}>{record.title}</Title>
        <Group gap="sm">
          <Group gap={6} wrap="nowrap">
            <Text size="xs" c="dimmed">
              再取得
            </Text>
            <SegmentedControl
              size="xs"
              aria-label="再取得"
              value={interval}
              onChange={(value) => onInterval(value as RefreshInterval)}
              data={[
                { label: '10秒', value: '10s' },
                { label: '30秒', value: '30s' },
                { label: 'しない', value: 'off' },
              ]}
            />
          </Group>
          <Menu position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="default" size="input-sm" aria-label="ダウンロード" title="ダウンロード">
                <DownloadIcon />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item onClick={() => downloadKif(kifText, record.title, 'sjis')}>KIF（Shift_JIS, .kif）</Menu.Item>
              <Menu.Item onClick={() => downloadKif(kifText, record.title, 'utf8')}>KIF（UTF-8, .kifu）</Menu.Item>
            </Menu.Dropdown>
          </Menu>
          {user?.id === record.owner && (
            <>
              <Button variant="light" color="red" onClick={() => setConfirmOpen(true)}>
                削除
              </Button>
              <Button component={Link} to={`/kifus/${record.id}/edit`} variant="light">
                編集
              </Button>
            </>
          )}
        </Group>
      </Group>
      <Modal opened={confirmOpen} onClose={() => setConfirmOpen(false)} title="棋譜の削除" centered>
        <Stack>
          <Text>この棋譜を削除します。元に戻せません。</Text>
          {deleteError && <Alert color="red">{deleteError}</Alert>}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirmOpen(false)} disabled={deleting}>
              キャンセル
            </Button>
            <Button color="red" onClick={() => void remove()} loading={deleting}>
              削除する
            </Button>
          </Group>
        </Stack>
      </Modal>
      <Group gap="lg" mb="md">
        {record.event && <Text>{record.event}</Text>}
        <Text c="dimmed">更新: {new Date(record.updated).toLocaleString('ja-JP')}</Text>
      </Group>
      {player.error && (
        <Alert color="red" title="KIF を読み込めません">
          {player.error.message}
        </Alert>
      )}
      {player.board && (
        <Grid gap="xl">
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Stack gap="md">
              <ShogiBoard
                state={player.board}
                orientation={orientation}
                senteName={record.sente || '先手'}
                goteName={record.gote || '後手'}
              />
              <PlyControls
                ply={player.ply}
                length={player.length}
                current={player.currentNode?.displayText}
                onChange={playback.seek}
                onFlip={() => setOrientation((o) => (o === 'sente' ? 'gote' : 'sente'))}
                playback={{ playing: playback.playing, onToggle: playback.toggle }}
              />
            </Stack>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="md">
              <Paper withBorder>
                <MoveList moves={player.moves} ply={player.ply} onSelect={playback.seek} />
              </Paper>
              {player.currentNode?.comment && (
                <Paper withBorder p="sm">
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                    {player.currentNode.comment}
                  </Text>
                </Paper>
              )}
            </Stack>
          </Grid.Col>
        </Grid>
      )}
    </>
  )
}

function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v11" />
      <path d="m7 11 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  )
}
