import { Button, Group, Slider, Stack, Text } from '@mantine/core'
import { useHotkeys, useMediaQuery, type HotkeyItem } from '@mantine/hooks'

interface Props {
  ply: number
  length: number
  /** 現在の手の表示（例: ☗７六歩） */
  current?: string
  onChange: (ply: number) => void
  onFlip: () => void
  /** 表示画面の連続再生。渡したときだけ中央のボタンを出す */
  playback?: { playing: boolean; onToggle: () => void }
}

export function PlyControls({ ply, length, current, onChange, onFlip, playback }: Props) {
  const touch = useMediaQuery('(pointer: coarse)')
  const size = touch ? 'sm' : 'xs'
  const hotkeys: HotkeyItem[] = [
    ['ArrowLeft', () => onChange(ply - 1)],
    ['ArrowRight', () => onChange(ply + 1)],
    ['Home', () => onChange(0)],
    ['End', () => onChange(length)],
  ]
  if (playback) hotkeys.push(['Space', playback.onToggle])
  useHotkeys(hotkeys)

  // タッチでは「開始」「最終」と同じく短くし、操作列の幅を保つ
  const playLabel = playback?.playing ? (touch ? '停止' : '一時停止') : '再生'

  return (
    <Stack gap="xs" maw={480}>
      <Slider min={0} max={length} value={ply} onChange={onChange} label={(v) => `${v}手目`} />
      <Group gap="xs" justify="center" wrap="nowrap">
        <Button variant="default" size={size} onClick={() => onChange(0)} disabled={ply === 0}>
          {touch ? '≪' : '≪ 開始'}
        </Button>
        <Button variant="default" size={size} onClick={() => onChange(ply - 1)} disabled={ply === 0}>
          ＜ 戻る
        </Button>
        {playback ? (
          <Button
            variant="default"
            size={size}
            w={touch ? 72 : 88}
            disabled={length === 0}
            aria-pressed={playback.playing}
            onClick={playback.onToggle}
          >
            {playLabel}
          </Button>
        ) : (
          <Text size="sm" w="5em" ta="center">
            {ply} / {length}
          </Text>
        )}
        <Button variant="default" size={size} onClick={() => onChange(ply + 1)} disabled={ply === length}>
          進む ＞
        </Button>
        <Button variant="default" size={size} onClick={() => onChange(length)} disabled={ply === length}>
          {touch ? '≫' : '最終 ≫'}
        </Button>
      </Group>
      <Group gap="xs" justify="center">
        {playback && (
          <Text size="sm">
            {ply} / {length}
          </Text>
        )}
        {current && (
          <Text size="sm" fw={500}>
            {ply > 0 ? `${ply}手目 ${current}` : current}
          </Text>
        )}
        <Button variant="subtle" size={size} onClick={onFlip}>
          盤面反転
        </Button>
      </Group>
    </Stack>
  )
}
